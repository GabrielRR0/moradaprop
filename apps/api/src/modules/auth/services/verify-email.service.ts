import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma';
import { AuditService } from '../../audit';
import { normalizeEmail, type LoginResult, type RequestContext } from '../utils/auth-context';
import { LoginService } from './login.service';
import { VerificationCodeService } from './verification-code.service';

@Injectable()
export class VerifyEmailService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly codes: VerificationCodeService,
    private readonly login: LoginService,
    private readonly audit: AuditService,
  ) {}

  /** Valida el codigo, marca el correo como verificado e inicia sesion. */
  async verify(rawEmail: string, code: string, context: RequestContext): Promise<LoginResult> {
    const email = normalizeEmail(rawEmail);
    const user = await this.prisma.user.findUnique({ where: { email } });
    // Mismo mensaje que un codigo incorrecto: no se revela si el correo existe.
    if (!user) throw new BadRequestException('Codigo invalido o vencido');

    await this.codes.consume(user.id, 'EMAIL_VERIFICATION', code);

    const verified = user.emailVerifiedAt
      ? user
      : await this.prisma.user.update({ where: { id: user.id }, data: { emailVerifiedAt: new Date() } });

    await this.audit.log({
      action: 'auth.email.verified',
      userId: user.id,
      ip: context.ip,
      userAgent: context.userAgent,
    });
    return this.login.finishLogin(verified, context);
  }
}
