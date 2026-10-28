import { ConflictException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma';
import type { RequestContext } from '../../../common/security/types';
import { AuditService } from '../../audit';
import { AgencyVault, UserVault } from '../../security';
import type { UpdateAgencyDto } from '../dto/agencies.dto';
import { AgencyAccessService } from './agency-access.service';
import { DbSupport } from '../../../support/db';

@Injectable()
export class AgencyProfileService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: AgencyAccessService,
    private readonly audit: AuditService,
    private readonly vault: UserVault,
    private readonly agencyVault: AgencyVault,
  ) {}

  /** La agencia del usuario con su equipo y el uso de su plan. */
  async me(userId: string) {
    const member = await this.access.requireMember(userId);
    const [members, properties] = await Promise.all([
      this.prisma.agencyMember.findMany({
        where: { agencyId: member.agencyId },
        orderBy: { createdAt: 'asc' },
        select: {
          id: true,
          role: true,
          invitationStatus: true,
          invitedEmail: true,
          createdAt: true,
          user: { select: { id: true, name: true, avatarUrl: true } },
        },
      }),
      this.prisma.property.count({ where: { agencyId: member.agencyId } }),
    ]);

    const { id, name, legalName, rif, description, logoUrl, bannerUrl, phone, whatsapp, website, maxProperties, maxAgents } =
      this.agencyVault.decodeProfile(member.agency);
    return {
      agency: { id, name, legalName, rif, description, logoUrl, bannerUrl, phone, whatsapp, website },
      myRole: member.role,
      plan: { maxProperties, maxAgents, properties, agents: members.filter((m) => m.role === 'AGENT').length },
      members: members.map((m) => ({ ...this.agencyVault.decodeMember(m), user: m.user ? this.vault.decode(m.user) : m.user })),
    };
  }

  async update(userId: string, dto: UpdateAgencyDto, context: RequestContext) {
    const admin = await this.access.requireAdmin(userId);
    try {
      await this.prisma.agencyProfile.update({ where: { id: admin.agencyId }, data: this.agencyVault.encodeProfile(dto) });
    } catch (error) {
      if (error instanceof DbSupport.Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('Ya existe una agencia con ese RIF');
      }
      throw error;
    }
    await this.audit.log({
      action: 'agencies.updated',
      userId,
      resource: 'AgencyProfile',
      resourceId: admin.agencyId,
      ip: context.ip,
      userAgent: context.userAgent,
      metadata: { fields: Object.keys(dto) },
    });
    return this.me(userId);
  }
}
