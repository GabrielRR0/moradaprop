import { BadRequestException, Injectable } from '@nestjs/common';
import { MailService } from '../../../support/mail';
import { PrismaService } from '../../../common/prisma';
import { AuditService } from '../../audit';
import { SecurityService } from '../../security';
import type { ResetPasswordDto } from '../dto/reset-password.dto';
import { normalizeEmail, type RequestContext } from '../utils/auth-context';
import { PasswordSupport } from '../../../support/password';
import { TokenService } from './token.service';
import { UserAccountService } from './user-account.service';
import { VerificationCodeService } from './verification-code.service';

const GENERIC_RESPONSE = { message: 'Si el correo existe, te enviamos un codigo para restablecer tu contrasena' };

@Injectable()
export class PasswordResetService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly codes: VerificationCodeService,
    private readonly mail: MailService,
    private readonly tokens: TokenService,
    private readonly security: SecurityService,
    private readonly audit: AuditService,
    private readonly accounts: UserAccountService,
  ) {}

  /** Envia un codigo al correo. Siempre responde lo mismo para no revelar si la cuenta existe. */
  async forgot(rawEmail: string, context: RequestContext) {
    const email = normalizeEmail(rawEmail);
    await this.security.assertNotBlocked({ ip: context.ip, email });

    const user = await this.accounts.findByEmail(email);
    if (user && user.status === 'ACTIVE') {
      try {
        const code = await this.codes.issue(user.id, 'PASSWORD_RESET');
        await this.mail.send(email, { name: 'reset-password', code, minutes: this.codes.ttlMinutes });
      } catch {
        // cooldown u otro fallo: la respuesta sigue siendo generica
      }
    }
    return GENERIC_RESPONSE;
  }

  /** Cambia la contrasena con el codigo, cierra todas las sesiones y quita bloqueos de login. */
  async reset(dto: ResetPasswordDto, context: RequestContext) {
    const user = await this.accounts.findByEmail(normalizeEmail(dto.email));
    if (!user) throw new BadRequestException('Codigo invalido o vencido');

    await this.codes.consume(user.id, 'PASSWORD_RESET', dto.code);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash: await PasswordSupport.hash(dto.newPassword),
        // Quien recibio el codigo en su correo demostro que es el dueno de la cuenta.
        emailVerifiedAt: user.emailVerifiedAt ?? new Date(),
        failedLogins: 0,
        lockedUntil: null,
      },
    });
    await this.tokens.revokeAll(user.id);
    await this.audit.log({
      action: 'auth.password.reset',
      userId: user.id,
      ip: context.ip,
      userAgent: context.userAgent,
    });
    return { message: 'Contrasena actualizada. Inicia sesion con la nueva' };
  }
}
