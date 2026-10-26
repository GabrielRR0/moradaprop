import { ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import type { User } from '@prisma/client';
import { AppConfig } from '../../../config';
import { PrismaService } from '../../../common/prisma';
import { AuditService } from '../../audit';
import { SecurityService } from '../../security';
import type { LoginDto } from '../dto/login.dto';
import { normalizeEmail, type LoginResult, type RequestContext } from '../utils/auth-context';
import { burnPasswordCheck, verifyPassword } from '../../../common/password';
import { TokenService } from './token.service';
import { UserAccountService } from './user-account.service';

const INVALID_CREDENTIALS = 'Credenciales invalidas';

@Injectable()
export class LoginService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tokens: TokenService,
    private readonly security: SecurityService,
    private readonly audit: AuditService,
    private readonly config: AppConfig,
    private readonly accounts: UserAccountService,
  ) {}

  /** Correo + contrasena. Si el usuario tiene 2FA, devuelve el desafio en vez de la sesion. */
  async login(dto: LoginDto, context: RequestContext): Promise<LoginResult> {
    const email = normalizeEmail(dto.email);
    await this.security.assertNotBlocked({ ip: context.ip, email });

    const user = await this.accounts.findByEmail(email);
    if (!user?.passwordHash) {
      await burnPasswordCheck(dto.password);
      throw new UnauthorizedException(INVALID_CREDENTIALS);
    }

    this.assertNotLocked(user);

    if (!(await verifyPassword(user.passwordHash, dto.password))) {
      await this.registerFailure(user, context);
      throw new UnauthorizedException(INVALID_CREDENTIALS);
    }

    if (!user.emailVerifiedAt) {
      throw new ForbiddenException({ message: 'Debes verificar tu correo', code: 'EMAIL_NOT_VERIFIED' });
    }
    return this.finishLogin(user, context);
  }

  /**
   * Paso comun a todos los metodos de entrada (clave, codigo de correo, Google):
   * revisa estado y bloqueos, y decide si falta el segundo paso.
   */
  async finishLogin(user: User, context: RequestContext, skipTwoFactor = false): Promise<LoginResult> {
    if (user.status !== 'ACTIVE') throw new ForbiddenException('Cuenta suspendida');
    await this.security.assertNotBlocked({ ip: context.ip, userId: user.id, email: user.email });

    if (user.twoFactorEnabled && !skipTwoFactor) {
      return {
        twoFactorRequired: true,
        challengeToken: await this.tokens.signTwoFactorChallenge(user.id),
        methods: ['totp', 'backup', 'email'],
      };
    }

    await this.clearFailures(user.id);
    const tokens = await this.tokens.startSession(user, context, user.twoFactorEnabled && skipTwoFactor);
    await this.audit.log({
      action: 'auth.login',
      userId: user.id,
      ip: context.ip,
      userAgent: context.userAgent,
    });
    return { twoFactorRequired: false, tokens };
  }

  assertNotLocked(user: User) {
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      throw new ForbiddenException('Cuenta bloqueada temporalmente por intentos fallidos. Intenta mas tarde');
    }
  }

  /** Suma un intento fallido y bloquea la cuenta al llegar al limite. */
  async registerFailure(user: User, context: RequestContext) {
    const { maxFailedLogins, lockMinutes } = this.config.auth;
    const failed = user.failedLogins + 1;
    const lock = failed >= maxFailedLogins;

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        failedLogins: lock ? 0 : failed,
        lockedUntil: lock ? new Date(Date.now() + lockMinutes * 60_000) : undefined,
      },
    });
    await this.audit.log({
      action: lock ? 'auth.account.locked' : 'auth.login.failed',
      userId: user.id,
      ip: context.ip,
      userAgent: context.userAgent,
    });
  }

  private clearFailures(userId: string) {
    return this.prisma.user.update({ where: { id: userId }, data: { failedLogins: 0, lockedUntil: null } });
  }
}
