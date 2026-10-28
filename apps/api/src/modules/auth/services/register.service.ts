import { Injectable } from '@nestjs/common';
import { MailService } from '../../../support/mail';
import { PrismaService } from '../../../common/prisma';
import { AuditService } from '../../audit';
import { AgencyVault, SecurityService, ThreatModelService, UserVault } from '../../security';
import { AccountType, type RegisterDto } from '../dto/register.dto';
import { normalizeEmail, type RequestContext } from '../utils/auth-context';
import { PasswordSupport } from '../../../support/password';
import { UserAccountService } from './user-account.service';
import { VerificationCodeService } from './verification-code.service';
import { DbSupport } from '../../../support/db';

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
    private readonly threats: ThreatModelService,
    private readonly audit: AuditService,
    private readonly accounts: UserAccountService,
    private readonly vault: UserVault,
    private readonly agencyVault: AgencyVault,
  ) {}

  /**
   * Crea la cuenta y envia el codigo por correo. Responde siempre lo mismo,
   * exista o no el correo, para no revelar quien esta registrado.
   */
  async register(dto: RegisterDto, context: RequestContext) {
    const email = normalizeEmail(dto.email);
    await this.security.assertNotBlocked({ ip: context.ip, email });

    const existing = await this.accounts.findByEmail(email);
    if (existing) {
      // Cuenta sin verificar: se reenvia el codigo. Cuenta verificada: no se hace nada.
      if (!existing.emailVerifiedAt) await this.sendVerificationCode(existing.id, email).catch(() => undefined);
      return REGISTER_RESPONSE;
    }

    try {
      const user = await this.prisma.$transaction(async (tx) => {
        const created = await tx.user.create({
          data: {
            ...this.vault.encode({ email, name: dto.name, phone: dto.phone ?? null }),
            passwordHash: await PasswordSupport.hash(dto.password),
            roles: this.rolesFor(dto.accountType),
            // Cuenta nueva de dueño o agencia: passkey o 2FA obligatorio desde el primer ingreso (sin plazo de gracia).
            secondFactorRequiredFrom: dto.accountType === AccountType.CLIENT ? undefined : new Date(),
          },
        });
        if (dto.accountType === AccountType.AGENCY) {
          await tx.agencyProfile.create({
            data: {
              name: dto.agencyName as string,
              members: {
                create: {
                  userId: created.id,
                  ...this.agencyVault.encodeMember({ invitedEmail: email }),
                  role: 'AGENCY_ADMIN',
                  invitationStatus: 'ACCEPTED',
                },
              },
            },
          });
        }
        return created;
      });

      // Cada cuenta nueva cuenta contra el escudo mass-registration (quien crea muchas desde una IP acaba bloqueado).
      await this.threats.report('mass-registration', { ip: context.ip });
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
      if (!(error instanceof DbSupport.Prisma.PrismaClientKnownRequestError && error.code === 'P2002')) throw error;
    }
    return REGISTER_RESPONSE;
  }

  /** Reenvia el codigo de verificacion (con cooldown). Respuesta generica. */
  async resendVerification(rawEmail: string) {
    const email = normalizeEmail(rawEmail);
    const user = await this.accounts.findByEmail(email);
    if (user && !user.emailVerifiedAt) await this.sendVerificationCode(user.id, email);
    return REGISTER_RESPONSE;
  }

  private async sendVerificationCode(userId: string, email: string) {
    const code = await this.codes.issue(userId, 'EMAIL_VERIFICATION');
    await this.mail.send(email, { name: 'verify-email', code, minutes: this.codes.ttlMinutes });
  }

  /** CLIENT siempre puede buscar; OWNER y AGENCY se suman segun lo elegido. */
  private rolesFor(accountType: AccountType): DbSupport.Role[] {
    switch (accountType) {
      case AccountType.OWNER:
        return [DbSupport.Role.CLIENT, DbSupport.Role.OWNER];
      case AccountType.AGENCY:
        return [DbSupport.Role.CLIENT, DbSupport.Role.AGENCY];
      default:
        return [DbSupport.Role.CLIENT];
    }
  }
}
