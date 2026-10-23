import {
  BadRequestException,
  ConflictException,
  Injectable,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { OAuth2Client } from 'google-auth-library';
import { AppConfig } from '../../../config';
import { MailService } from '../../../common/mail';
import { PrismaService } from '../../../common/prisma';
import { AuditService } from '../../audit';
import { SecurityService } from '../../security';
import type { LoginResult, RequestContext } from '../utils/auth-context';
import { normalizeEmail } from '../utils/auth-context';
import { LoginService } from './login.service';
import { VerificationCodeService } from './verification-code.service';

const PROVIDER = 'google';

interface GoogleIdentity {
  sub: string;
  email: string;
  name: string;
  picture?: string;
}

export type GoogleLoginResult = LoginResult | { linkRequired: true; email: string; message: string };

/** Iniciar sesion con Google y asociar/desasociar Google a una cuenta existente. */
@Injectable()
export class GoogleAuthService {
  private readonly client: OAuth2Client;

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: AppConfig,
    private readonly login: LoginService,
    private readonly codes: VerificationCodeService,
    private readonly mail: MailService,
    private readonly security: SecurityService,
    private readonly audit: AuditService,
  ) {
    this.client = new OAuth2Client(config.google.clientId);
  }

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
      where: { provider_providerId: { provider: PROVIDER, providerId: identity.sub } },
      include: { user: true },
    });
    if (linked) return this.login.finishLogin(linked.user, context);

    const existing = await this.prisma.user.findUnique({ where: { email: identity.email } });
    if (existing) {
      const code = await this.codes.issue(existing.id, 'LINK_SOCIAL_ACCOUNT', { providerId: identity.sub });
      await this.mail.send(existing.email, { name: 'link-google', code, minutes: this.codes.ttlMinutes });
      return {
        linkRequired: true,
        email: existing.email,
        message: 'Ya existe una cuenta con este correo. Te enviamos un codigo para vincular Google',
      };
    }

    const user = await this.prisma.user.create({
      data: {
        email: identity.email,
        name: identity.name,
        avatarUrl: identity.picture,
        emailVerifiedAt: new Date(),
        socialAccounts: { create: { provider: PROVIDER, providerId: identity.sub, email: identity.email } },
      },
    });
    await this.audit.log({
      action: 'auth.google.register',
      userId: user.id,
      ip: context.ip,
      userAgent: context.userAgent,
    });
    return this.login.finishLogin(user, context);
  }

  /** Confirma el codigo enviado al correo y vincula Google a esa cuenta. */
  async confirmLink(idToken: string, code: string, context: RequestContext): Promise<GoogleLoginResult> {
    const identity = await this.verifyIdToken(idToken);
    const user = await this.prisma.user.findUnique({ where: { email: identity.email } });
    if (!user) throw new BadRequestException('Codigo invalido o vencido');

    const payload = (await this.codes.consume(user.id, 'LINK_SOCIAL_ACCOUNT', code)) as {
      providerId?: string;
    } | null;
    // El codigo solo vale para la cuenta de Google con la que se pidio.
    if (payload?.providerId !== identity.sub) throw new BadRequestException('Codigo invalido o vencido');

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

  private async attach(userId: string, identity: GoogleIdentity) {
    const taken = await this.prisma.socialAccount.findUnique({
      where: { provider_providerId: { provider: PROVIDER, providerId: identity.sub } },
    });
    if (taken && taken.userId !== userId) {
      throw new ConflictException('Esa cuenta de Google ya esta vinculada a otro usuario');
    }
    if (!taken) {
      await this.prisma.socialAccount.create({
        data: { userId, provider: PROVIDER, providerId: identity.sub, email: identity.email },
      });
    }
  }

  private async verifyIdToken(idToken: string): Promise<GoogleIdentity> {
    const { clientId, enabled } = this.config.google;
    if (!enabled || !clientId) throw new ServiceUnavailableException('Google no esta configurado');

    try {
      const ticket = await this.client.verifyIdToken({ idToken, audience: clientId });
      const data = ticket.getPayload();
      if (!data?.sub || !data.email || !data.email_verified) throw new Error('correo no verificado');
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
