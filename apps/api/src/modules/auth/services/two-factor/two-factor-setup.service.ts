import { BadRequestException, ConflictException, ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { AppConfig } from '@/config';
import { PrismaService } from '@/common/prisma';
import { AuditService } from '@/modules/audit';
import { AccessRiskService, FieldCipher } from '@/modules/security';
import { DbSupport } from '@/support/db';
import { PasswordSupport } from '@/support/password';
import { TotpSupport } from '@/support/totp';
import type { RequestContext } from '../../utils/auth-context';
import { UserAccountService } from '../account/user-account.service';
import { SessionService } from '../sign-in/session.service';
import { TwoFactorVerifier } from './two-factor-verifier.service';

/** Activar y desactivar el segundo factor (app autenticadora) y renovar los codigos de respaldo. */
@Injectable()
export class TwoFactorSetupService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly sessions: SessionService,
    private readonly verifier: TwoFactorVerifier,
    private readonly audit: AuditService,
    private readonly cipher: FieldCipher,
    private readonly accounts: UserAccountService,
    private readonly config: AppConfig,
    private readonly risk: AccessRiskService,
  ) {}

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

    await this.verifier.verifyTotp(user, code);
    await this.prisma.user.update({ where: { id: userId }, data: { twoFactorEnabled: true } });

    const backupCodes = await this.verifier.createBackupCodes(userId);
    const accessToken = await this.sessions.markTwoFactorVerified({ ...user, twoFactorEnabled: true }, sessionId);
    await this.audit.log({ action: 'auth.2fa.enabled', userId, ip: context.ip, userAgent: context.userAgent });
    return { backupCodes, accessToken };
  }

  /** Desactiva el 2FA. Pide contrasena (si la cuenta tiene) y un codigo valido. */
  async disable(userId: string, sessionId: string, password: string | undefined, code: string, context: RequestContext) {
    const user = await this.getUser(userId);
    if (!user.twoFactorEnabled) throw new BadRequestException('El 2FA no esta activo');

    await this.assertPassword(user, password);
    await this.verifier.verifyAnyCode(user, code);

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: userId },
        data: { twoFactorEnabled: false, twoFactorSecret: null, twoFactorLastStep: null },
      }),
      this.prisma.twoFactorBackupCode.deleteMany({ where: { userId } }),
    ]);
    await this.sessions.revokeAll(userId, sessionId);
    await this.audit.log({ action: 'auth.2fa.disabled', userId, ip: context.ip, userAgent: context.userAgent });
    return { message: 'Verificacion en dos pasos desactivada' };
  }

  /** Genera codigos de respaldo nuevos (los anteriores dejan de servir). */
  async regenerateBackupCodes(userId: string, password: string | undefined, code: string, context: RequestContext) {
    const user = await this.getUser(userId);
    if (!user.twoFactorEnabled) throw new BadRequestException('El 2FA no esta activo');

    await this.assertPassword(user, password);
    await this.verifier.verifyAnyCode(user, code);

    const backupCodes = await this.verifier.createBackupCodes(userId);
    await this.audit.log({ action: 'auth.2fa.backup-regenerated', userId, ip: context.ip, userAgent: context.userAgent });
    return { backupCodes };
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
