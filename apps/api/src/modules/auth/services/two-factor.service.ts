import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AppConfig } from '../../../config';
import { CryptoService } from '../../../common/crypto';
import { MailService } from '../../../support/mail';
import { PrismaService } from '../../../common/prisma';
import { AuditService } from '../../audit';
import { AccessRiskService, FieldCipher } from '../../security';
import type { LoginResult, RequestContext } from '../utils/auth-context';
import { PasswordSupport } from '../../../support/password';
import { TotpSupport } from '../../../support/totp';
import { LoginService } from './login.service';
import { TokenService } from './token.service';
import { UserAccountService } from './user-account.service';
import { VerificationCodeService } from './verification-code.service';
import { DbSupport } from '../../../support/db';

const INVALID_CODE = 'Codigo invalido';
const BACKUP_CODE = /^[a-z0-9]{5}-[a-z0-9]{5}$/;

@Injectable()
export class TwoFactorService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly crypto: CryptoService,
    private readonly tokens: TokenService,
    private readonly login: LoginService,
    private readonly codes: VerificationCodeService,
    private readonly mail: MailService,
    private readonly audit: AuditService,
    private readonly cipher: FieldCipher,
    private readonly accounts: UserAccountService,
    private readonly config: AppConfig,
    private readonly risk: AccessRiskService,
  ) {}

  // ---------------------------------------------------------------
  // Activar / desactivar
  // ---------------------------------------------------------------

  /** Genera el secreto y el QR. Aun no queda activo hasta confirmar con un codigo. */
  async setup(userId: string, context: RequestContext) {
    // Activar un 2FA solo desde un dispositivo confirmado: si no, un atacante con la clave dejaria fuera al dueño.
    await this.risk.assertTrustedContext({ id: userId }, context);
    const user = await this.getUser(userId);
    if (user.twoFactorEnabled) throw new ConflictException('El 2FA ya esta activo');

    const secret = TotpSupport.generateSecret();
    await this.prisma.user.update({
      where: { id: userId },
      data: { twoFactorSecret: this.cipher.encrypt('User.twoFactorSecret', secret), twoFactorLastStep: null },
    });

    const otpauthUrl = TotpSupport.keyUri(user.email, this.config.app.name, secret);
    return { secret, otpauthUrl, qrCode: await TotpSupport.qrDataUrl(otpauthUrl) };
  }

  /** Confirma el primer codigo, activa el 2FA y entrega los codigos de respaldo (una sola vez). */
  async confirm(userId: string, sessionId: string, code: string, context: RequestContext) {
    await this.risk.assertTrustedContext({ id: userId }, context);
    const user = await this.getUser(userId);
    if (user.twoFactorEnabled) throw new ConflictException('El 2FA ya esta activo');
    if (!user.twoFactorSecret) throw new BadRequestException('Primero inicia la configuracion del 2FA');

    await this.verifyTotp(user, code);
    await this.prisma.user.update({ where: { id: userId }, data: { twoFactorEnabled: true } });

    const backupCodes = await this.createBackupCodes(userId);
    const accessToken = await this.tokens.markTwoFactorVerified({ ...user, twoFactorEnabled: true }, sessionId);
    await this.audit.log({ action: 'auth.2fa.enabled', userId, ip: context.ip, userAgent: context.userAgent });
    return { backupCodes, accessToken };
  }

  /** Desactiva el 2FA. Pide contrasena (si la cuenta tiene) y un codigo valido. */
  async disable(userId: string, sessionId: string, password: string | undefined, code: string, context: RequestContext) {
    const user = await this.getUser(userId);
    if (!user.twoFactorEnabled) throw new BadRequestException('El 2FA no esta activo');

    await this.assertPassword(user, password);
    await this.verifyAnyCode(user, code);

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: userId },
        data: { twoFactorEnabled: false, twoFactorSecret: null, twoFactorLastStep: null },
      }),
      this.prisma.twoFactorBackupCode.deleteMany({ where: { userId } }),
    ]);
    await this.tokens.revokeAll(userId, sessionId);
    await this.audit.log({ action: 'auth.2fa.disabled', userId, ip: context.ip, userAgent: context.userAgent });
    return { message: 'Verificacion en dos pasos desactivada' };
  }

  /** Genera codigos de respaldo nuevos (los anteriores dejan de servir). */
  async regenerateBackupCodes(userId: string, password: string | undefined, code: string, context: RequestContext) {
    const user = await this.getUser(userId);
    if (!user.twoFactorEnabled) throw new BadRequestException('El 2FA no esta activo');

    await this.assertPassword(user, password);
    await this.verifyAnyCode(user, code);

    const backupCodes = await this.createBackupCodes(userId);
    await this.audit.log({ action: 'auth.2fa.backup-regenerated', userId, ip: context.ip, userAgent: context.userAgent });
    return { backupCodes };
  }

  // ---------------------------------------------------------------
  // Segundo paso del login
  // ---------------------------------------------------------------

  /** Envia un codigo al correo como alternativa a la app autenticadora. */
  async sendEmailCode(challengeToken: string) {
    const { sub, risk } = await this.tokens.verifyTwoFactorChallenge(challengeToken);
    // En un inicio de sesion muy raro el correo no prueba nada fuerte: solo app autenticadora o codigo de respaldo.
    if (risk === 'HIGH' && this.risk.mode === 'enforce') {
      throw new ForbiddenException('Por seguridad, en este inicio de sesion usa tu app autenticadora o un codigo de respaldo');
    }
    const user = await this.getUser(sub);
    const code = await this.codes.issue(user.id, 'TWO_FACTOR_EMAIL');
    await this.mail.send(user.email, { name: 'two-factor-code', code, minutes: this.codes.ttlMinutes });
    return { message: 'Te enviamos un codigo al correo' };
  }

  /** Completa el login con TOTP, codigo de respaldo o codigo por correo. */
  async completeLogin(challengeToken: string, code: string, context: RequestContext): Promise<LoginResult> {
    const { sub, risk } = await this.tokens.verifyTwoFactorChallenge(challengeToken);
    const strong = risk === 'HIGH' && this.risk.mode === 'enforce';
    const user = await this.getUser(sub);
    this.login.assertNotLocked(user);

    try {
      await this.verifyAnyCode(user, code, !strong);
    } catch (error) {
      await this.login.registerFailure(user, context);
      // Fallar el segundo factor en un inicio muy raro es la huella de un atacante: a los 3 fallos se bloquea.
      if (strong) await this.risk.stepUpFailed(user, context);
      throw error;
    }
    return this.login.finishLogin(user, context, true);
  }

  // ---------------------------------------------------------------
  // Verificacion de codigos
  // ---------------------------------------------------------------

  /** TOTP, o codigo de respaldo; durante el login tambien el codigo enviado por correo. */
  private async verifyAnyCode(user: DbSupport.User, code: string, allowEmail = false) {
    const clean = code.trim().toLowerCase();

    if (/^\d{6}$/.test(clean)) {
      if (allowEmail && (await this.tryEmailCode(user.id, clean))) return;
      return this.verifyTotp(user, clean);
    }
    if (BACKUP_CODE.test(clean)) return this.consumeBackupCode(user.id, clean);
    throw new UnauthorizedException(INVALID_CODE);
  }

  private async tryEmailCode(userId: string, code: string): Promise<boolean> {
    try {
      await this.codes.consume(userId, 'TWO_FACTOR_EMAIL', code);
      return true;
    } catch {
      return false;
    }
  }

  /** Valida un TOTP (tolerancia de +-30s) y rechaza reusar el mismo paso de tiempo. */
  private async verifyTotp(user: DbSupport.User, code: string) {
    if (!user.twoFactorSecret) throw new UnauthorizedException(INVALID_CODE);

    // delta: 0 = paso actual, -1 = anterior, 1 = siguiente; null = codigo incorrecto.
    const delta = TotpSupport.check(code,this.cipher.decrypt('User.twoFactorSecret', user.twoFactorSecret));
    if (delta === null) throw new UnauthorizedException(INVALID_CODE);

    // Anti-replay: un paso de tiempo ya aceptado no se puede volver a usar.
    const step = Math.floor(Date.now() / 1000 / TotpSupport.PERIOD_SECONDS) + delta;
    if (user.twoFactorLastStep !== null && step <= user.twoFactorLastStep) {
      throw new UnauthorizedException(INVALID_CODE);
    }
    await this.prisma.user.update({ where: { id: user.id }, data: { twoFactorLastStep: step } });
  }

  private async consumeBackupCode(userId: string, code: string) {
    const hash = this.crypto.hashCode(code, `${userId}:backup`);
    const { count } = await this.prisma.twoFactorBackupCode.updateMany({
      where: { userId, codeHash: hash, usedAt: null },
      data: { usedAt: new Date() },
    });
    if (count !== 1) throw new UnauthorizedException(INVALID_CODE);
  }

  private async createBackupCodes(userId: string): Promise<string[]> {
    const codes = Array.from({ length: this.config.auth.backupCodesCount }, () => {
      const raw = this.crypto.randomToken(8).replace(/[^a-z0-9]/gi, '').toLowerCase().padEnd(10, '0');
      return `${raw.slice(0, 5)}-${raw.slice(5, 10)}`;
    });
    await this.prisma.$transaction([
      this.prisma.twoFactorBackupCode.deleteMany({ where: { userId } }),
      this.prisma.twoFactorBackupCode.createMany({
        data: codes.map((code) => ({ userId, codeHash: this.crypto.hashCode(code, `${userId}:backup`) })),
      }),
    ]);
    return codes;
  }

  private async assertPassword(user: DbSupport.User, password: string | undefined) {
    if (!user.passwordHash) return; // cuenta creada solo con Google
    if (!password || !(await PasswordSupport.verify(user.passwordHash, password))) {
      throw new ForbiddenException('Contrasena incorrecta');
    }
  }

  private async getUser(userId: string): Promise<DbSupport.User> {
    const user = await this.accounts.findById(userId);
    if (!user) throw new UnauthorizedException('Sesion invalida');
    return user;
  }
}
