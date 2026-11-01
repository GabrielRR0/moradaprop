import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/common/prisma';
import type { AuthUserContext } from '@/common/security/types';
import type { ResourcePolicy } from '@/modules/security';
import { DbSupport } from '@/support/db';
import type { TeamMembership } from '../../utils/reply-template-mapper';

export type TemplateRow = DbSupport.Prisma.ReplyTemplateGetPayload<Record<string, never>>;

/**
 * Pertenencia de un texto reutilizable para OwnershipService.
 *   edit, delete -> su autor, o el administrador de la inmobiliaria con la que esta compartido
 * Los textos privados de otra persona no se confirman ni a un administrador: quien no cumple recibe 404.
 */
@Injectable()
export class ReplyTemplatePolicy implements ResourcePolicy<TemplateRow> {
  readonly resource = 'ReplyTemplate';
  readonly notFound = 'Texto no encontrado';

  constructor(private readonly prisma: PrismaService) {}

  /** La inmobiliaria del usuario (invitación aceptada) y si la administra. */
  async membership(userId: string): Promise<TeamMembership | null> {
    const member = await this.prisma.agencyMember.findFirst({
      where: { userId, invitationStatus: 'ACCEPTED' },
      orderBy: { createdAt: 'asc' },
      select: { agencyId: true, role: true },
    });
    return member ? { agencyId: member.agencyId, admin: member.role === 'AGENCY_ADMIN' } : null;
  }

  find(id: string) {
    return this.prisma.replyTemplate.findUnique({ where: { id } });
  }

  async can(user: AuthUserContext, template: TemplateRow, action: string): Promise<boolean> {
    if (action !== 'edit' && action !== 'delete') return false;
    if (template.ownerUserId === user.id) return true;
    if (!template.agencyId) return false;
    const team = await this.membership(user.id);
    return team?.agencyId === template.agencyId && team.admin;
  }
}
