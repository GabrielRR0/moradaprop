import { Injectable } from '@nestjs/common';
import { Prisma, Role } from '@prisma/client';
import { MailService } from '../../../common/mail';
import { PrismaService } from '../../../common/prisma';
import { AuditService } from '../../audit';
import { SecurityService } from '../../security';
import { AccountType, type RegisterDto } from '../dto/register.dto';
import { normalizeEmail, type RequestContext } from '../utils/auth-context';
import { hashPassword } from '../../../common/password';
import { VerificationCodeService } from './verification-code.service';

export const REGISTER_RESPONSE = {
  message: 'Si el correo es valido, te enviamos un codigo de verificacion',
};

@Injectable()
export class RegisterService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly codes: VerificationCodeService,
    private readonly mail: MailService,
    private readonly security: SecurityService,
    private readonly audit: AuditService,
  ) {}

  /**
   * Crea la cuenta y envia el codigo por correo. Responde siempre lo mismo,
   * exista o no el correo, para no revelar quien esta registrado.
   */
  async register(dto: RegisterDto, context: RequestContext) {
    const email = normalizeEmail(dto.email);
    await this.security.assertNotBlocked({ ip: context.ip, email });

    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) {
      // Cuenta sin verificar: se reenvia el codigo. Cuenta verificada: no se hace nada.
      if (!existing.emailVerifiedAt) await this.sendVerificationCode(existing.id, email).catch(() => undefined);
      return REGISTER_RESPONSE;
    }

    try {
      const user = await this.prisma.$transaction(async (tx) => {
        const created = await tx.user.create({
          data: {
            email,
            name: dto.name,
            phone: dto.phone,
            passwordHash: await hashPassword(dto.password),
            roles: this.rolesFor(dto.accountType),
          },
        });
        if (dto.accountType === AccountType.AGENCY) {
          await tx.agencyProfile.create({
            data: {
              name: dto.agencyName as string,
              members: {
                create: {
                  userId: created.id,
                  invitedEmail: email,
                  role: 'AGENCY_ADMIN',
                  invitationStatus: 'ACCEPTED',
                },
              },
            },
          });
        }
        return created;
      });

      await this.sendVerificationCode(user.id, email);
      await this.audit.log({
        action: 'auth.register',
        userId: user.id,
        resource: 'User',
        resourceId: user.id,
        ip: context.ip,
        userAgent: context.userAgent,
        metadata: { accountType: dto.accountType },
      });
    } catch (error) {
      // Dos registros simultaneos con el mismo correo: se trata igual que "ya existe".
      if (!(error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002')) throw error;
    }
    return REGISTER_RESPONSE;
  }

  /** Reenvia el codigo de verificacion (con cooldown). Respuesta generica. */
  async resendVerification(rawEmail: string) {
    const email = normalizeEmail(rawEmail);
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (user && !user.emailVerifiedAt) await this.sendVerificationCode(user.id, email);
    return REGISTER_RESPONSE;
  }

  private async sendVerificationCode(userId: string, email: string) {
    const code = await this.codes.issue(userId, 'EMAIL_VERIFICATION');
    await this.mail.send(email, { name: 'verify-email', code, minutes: this.codes.ttlMinutes });
  }

  /** CLIENT siempre puede buscar; OWNER y AGENCY se suman segun lo elegido. */
  private rolesFor(accountType: AccountType): Role[] {
    switch (accountType) {
      case AccountType.OWNER:
        return [Role.CLIENT, Role.OWNER];
      case AccountType.AGENCY:
        return [Role.CLIENT, Role.AGENCY];
      default:
        return [Role.CLIENT];
    }
  }
}
