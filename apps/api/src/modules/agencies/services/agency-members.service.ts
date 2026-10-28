import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { AppConfig } from '../../../config';
import { CryptoService } from '../../../common/crypto';
import { MailService } from '../../../support/mail';
import { PrismaService } from '../../../common/prisma';
import type { RequestContext } from '../../../common/security/types';
import { AuditService } from '../../audit';
import { AgencyVault, UserVault } from '../../security';
import { AgencyAccessService } from './agency-access.service';
import { DbSupport } from '../../../support/db';

const INVITATION_DAYS = 7;
const INVALID_INVITATION = 'Invitacion invalida o vencida';

@Injectable()
export class AgencyMembersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: AgencyAccessService,
    private readonly crypto: CryptoService,
    private readonly mail: MailService,
    private readonly audit: AuditService,
    private readonly config: AppConfig,
    private readonly vault: UserVault,
    private readonly agencyVault: AgencyVault,
  ) {}

  /** El administrador invita a un agente por correo. El enlace lleva un token de un solo uso. */
  async invite(adminId: string, rawEmail: string, context: RequestContext) {
    const admin = await this.access.requireAdmin(adminId);
    const email = rawEmail.trim().toLowerCase();

    const agents = await this.prisma.agencyMember.count({
      where: { agencyId: admin.agencyId, role: 'AGENT', invitationStatus: { not: 'REVOKED' } },
    });
    if (agents >= admin.agency.maxAgents) {
      throw new ConflictException(`Tu plan permite hasta ${admin.agency.maxAgents} agentes`);
    }

    const existing = await this.prisma.agencyMember.findUnique({
      where: { agencyId_invitedEmailHash: { agencyId: admin.agencyId, invitedEmailHash: this.agencyVault.invitedEmailHash(email) } },
    });
    if (existing && existing.invitationStatus === 'ACCEPTED') {
      throw new ConflictException('Esa persona ya pertenece a la agencia');
    }

    const token = this.crypto.randomToken();
    const data = {
      invitationTokenHash: this.crypto.hashToken(token),
      invitationExpiresAt: new Date(Date.now() + INVITATION_DAYS * 24 * 60 * 60 * 1000),
      invitationStatus: 'PENDING' as const,
    };
    const member = existing
      ? await this.prisma.agencyMember.update({ where: { id: existing.id }, data })
      : await this.prisma.agencyMember.create({
          data: { agencyId: admin.agencyId, ...this.agencyVault.encodeMember({ invitedEmail: email }), role: 'AGENT', ...data },
        });

    await this.mail.send(email, {
      name: 'agency-invitation',
      agencyName: admin.agency.name,
      link: `${this.config.app.frontendUrl}/agency/invitation?token=${token}`,
    });
    await this.audit.log({
      action: 'agencies.agent.invited',
      userId: adminId,
      resource: 'AgencyMember',
      resourceId: member.id,
      ip: context.ip,
      userAgent: context.userAgent,
      metadata: { email },
    });
    return { id: member.id, email, status: member.invitationStatus };
  }

  /**
   * La persona invitada acepta con su sesion. Su correo verificado debe ser el invitado:
   * asi un token filtrado no sirve para otra cuenta.
   */
  async accept(userId: string, token: string, context: RequestContext) {
    const member = await this.prisma.agencyMember.findUnique({
      where: { invitationTokenHash: this.crypto.hashToken(token) },
    });
    if (!member || member.invitationStatus !== 'PENDING' || !member.invitationExpiresAt || member.invitationExpiresAt < new Date()) {
      throw new BadRequestException(INVALID_INVITATION);
    }

    const user = this.vault.decode(await this.prisma.user.findUniqueOrThrow({ where: { id: userId } }));
    if (!user.emailVerifiedAt || member.invitedEmailHash !== this.agencyVault.invitedEmailHash(user.email)) {
      throw new ForbiddenException('Esta invitacion es para otro correo');
    }
    const already = await this.prisma.agencyMember.findFirst({ where: { userId, invitationStatus: 'ACCEPTED' } });
    if (already) throw new ConflictException('Ya perteneces a una agencia');

    await this.prisma.$transaction([
      this.prisma.agencyMember.update({
        where: { id: member.id },
        data: { userId, invitationStatus: 'ACCEPTED', invitationTokenHash: null, invitationExpiresAt: null },
      }),
      this.prisma.user.update({
        where: { id: userId },
        data: { roles: { set: [...new Set([...user.roles, DbSupport.Role.AGENCY])] } },
      }),
    ]);
    await this.audit.log({
      action: 'agencies.invitation.accepted',
      userId,
      resource: 'AgencyMember',
      resourceId: member.id,
      ip: context.ip,
      userAgent: context.userAgent,
    });
    // El rol AGENCY ya esta en la base; el token actual no lo trae hasta renovarlo (/auth/refresh).
    return { message: 'Te uniste a la agencia. Renueva tu sesion para ver los cambios' };
  }

  /** Quita a un agente: sus propiedades quedan sin asignar y pierde el rol AGENCY. */
  async remove(adminId: string, memberId: string, context: RequestContext) {
    const admin = await this.access.requireAdmin(adminId);
    const member = await this.prisma.agencyMember.findFirst({ where: { id: memberId, agencyId: admin.agencyId } });
    if (!member) throw new NotFoundException('Miembro no encontrado');
    if (member.role === 'AGENCY_ADMIN') throw new BadRequestException('No se puede quitar al administrador de la agencia');

    await this.prisma.$transaction(async (tx) => {
      if (member.userId) {
        await tx.property.updateMany({
          where: { agencyId: admin.agencyId, assignedAgentId: member.userId },
          data: { assignedAgentId: null },
        });
        const user = await tx.user.findUniqueOrThrow({ where: { id: member.userId } });
        await tx.user.update({ where: { id: member.userId }, data: { roles: { set: user.roles.filter((r) => r !== DbSupport.Role.AGENCY) } } });
        await tx.session.updateMany({ where: { userId: member.userId, revokedAt: null }, data: { revokedAt: new Date() } });
      }
      await tx.agencyMember.delete({ where: { id: member.id } });
    });
    await this.audit.log({
      action: 'agencies.agent.removed',
      userId: adminId,
      resource: 'AgencyMember',
      resourceId: memberId,
      ip: context.ip,
      userAgent: context.userAgent,
    });
  }
}
