import {
  BadRequestException,
  ConflictException,
  Injectable,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { AppConfig } from '../../../config';
import { GoogleIdentitySupport } from '../../../support/google-identity';
import { MailSupport } from '../../../support/mail';
import { PrismaService } from '../../../common/prisma';
import { AuditService } from '../../audit';
import { SecurityService, SocialAccountVault, UserVault } from '../../security';
import type { LoginResult, RequestContext } from '../utils/auth-context';
import { normalizeEmail } from '../utils/auth-context';
import { LoginService } from './login.service';
import { UserAccountService } from './user-account.service';
import { VerificationCodeService } from './verification-code.service';

const PROVIDER = 'google';

interface VerifiedGoogleUser {
  sub: string;
  email: string;
  name: string;
  picture?: string;
}

export type GoogleLoginResult = LoginResult | { linkRequired: true; email: string; message: string };

/** Iniciar sesion con Google y asociar/desasociar Google a una cuenta existente. */
@Injectable()
export class GoogleAuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: AppConfig,
    private readonly login: LoginService,
    private readonly codes: VerificationCodeService,
    private readonly mail: MailSupport.Service,
    private readonly security: SecurityService,
    private readonly audit: AuditService,
    private readonly accounts: UserAccountService,
    private readonly vault: UserVault,
    private readonly social: SocialAccountVault,
    private readonly google: GoogleIdentitySupport.Verifier,
  ) {}

  /**
   * Entrar con Google:
   *  - Google ya vinculado -> sesion.
   *  - Correo existente sin vinculo -> NO se vincula solo: se envia un codigo al correo
   *    de la cuenta y hay que confirmarlo (evita tomar cuentas ajenas).
   *  - Correo nuevo -> se crea la cuenta (verificada) como CLIENT.
   */
  async loginWithGoogle(idToken: string, context: RequestContext): Promise<GoogleLoginResult> {
    const identity = await this.verifyIdToken(idToken);
    await this.security.assertNotBlocked({ ip: context.ip, email: identity.email });

    const linked = await this.prisma.socialAccount.findUnique({
      where: { provider_providerId: { provider: PROVIDER, providerId: this.social.providerId(identity.sub) } },
      include: { user: true },
    });
    if (linked) return this.login.finishLogin(this.vault.decode(linked.user), context);

    const existing = await this.accounts.findByEmail(identity.email);
    if (existing) {
      const code = await this.codes.issue(existing.id, 'LINK_SOCIAL_ACCOUNT', { providerId: this.social.providerId(identity.sub) });
      await this.mail.send(existing.email, { name: 'link-google', code, minutes: this.codes.ttlMinutes });
      return {
        linkRequired: true,
        email: existing.email,
        message: 'Ya existe una cuenta con este correo. Te enviamos un codigo para vincular Google',
      };
    }

    const user = await this.prisma.user.create({
      data: {
        ...this.vault.encode({ email: identity.email, name: identity.name }),
        avatarUrl: identity.picture,
        emailVerifiedAt: new Date(),
        socialAccounts: { create: { provider: PROVIDER, ...this.social.encode({ providerId: identity.sub, email: identity.email }) } },
      },
    });
    await this.audit.log({
      action: 'auth.google.register',
      userId: user.id,
      ip: context.ip,
      userAgent: context.userAgent,
    });
    return this.login.finishLogin(this.vault.decode(user), context);
  }

  /** Confirma el codigo enviado al correo y vincula Google a esa cuenta. */
  async confirmLink(idToken: string, code: string, context: RequestContext): Promise<GoogleLoginResult> {
    const identity = await this.verifyIdToken(idToken);
    const user = await this.accounts.findByEmail(identity.email);
    if (!user) throw new BadRequestException('Codigo invalido o vencido');

    const payload = (await this.codes.consume(user.id, 'LINK_SOCIAL_ACCOUNT', code)) as {
      providerId?: string;
    } | null;
    // El codigo solo vale para la cuenta de Google con la que se pidio.
    if (payload?.providerId !== this.social.providerId(identity.sub)) throw new BadRequestException('Codigo invalido o vencido');

    await this.attach(user.id, identity);
    await this.audit.log({
      action: 'auth.google.linked',
      userId: user.id,
      ip: context.ip,
      userAgent: context.userAgent,
    });
    return this.login.finishLogin(user, context);
  }

  /** Usuario con sesion iniciada asocia su cuenta de Google. */
  async linkToUser(userId: string, idToken: string, context: RequestContext) {
    const identity = await this.verifyIdToken(idToken);
    await this.attach(userId, identity);
    await this.audit.log({ action: 'auth.google.linked', userId, ip: context.ip, userAgent: context.userAgent });
    return { message: 'Cuenta de Google vinculada' };
  }

  /** Quita Google de la cuenta. Exige tener contrasena para no quedarse sin forma de entrar. */
  async unlink(userId: string, context: RequestContext) {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
    if (!user.passwordHash) {
      throw new ConflictException('Define una contrasena antes de desvincular Google');
    }
    await this.prisma.socialAccount.deleteMany({ where: { userId, provider: PROVIDER } });
    await this.audit.log({ action: 'auth.google.unlinked', userId, ip: context.ip, userAgent: context.userAgent });
    return { message: 'Cuenta de Google desvinculada' };
  }

  private async attach(userId: string, identity: VerifiedGoogleUser) {
    const taken = await this.prisma.socialAccount.findUnique({
      where: { provider_providerId: { provider: PROVIDER, providerId: this.social.providerId(identity.sub) } },
    });
    if (taken && taken.userId !== userId) {
      throw new ConflictException('Esa cuenta de Google ya esta vinculada a otro usuario');
    }
    if (!taken) {
      await this.prisma.socialAccount.create({
        data: { userId, provider: PROVIDER, ...this.social.encode({ providerId: identity.sub, email: identity.email }) },
      });
    }
  }

  private async verifyIdToken(idToken: string): Promise<VerifiedGoogleUser> {
    const { clientId, enabled } = this.config.google;
    if (!enabled || !clientId) throw new ServiceUnavailableException('Google no esta configurado');

    try {
      const data = await this.google.verify(idToken, clientId);
      if (!data.email || !data.emailVerified) throw new Error('correo no verificado');
      return {
        sub: data.sub,
        email: normalizeEmail(data.email),
        name: data.name ?? data.email.split('@')[0],
        picture: data.picture,
      };
    } catch {
      throw new UnauthorizedException('No se pudo validar tu cuenta de Google');
    }
  }
}
