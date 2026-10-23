import { ForbiddenException, Injectable } from '@nestjs/common';
import { Role, type AgencyMember, type Prisma } from '@prisma/client';
import { PrismaService } from '../../../common/prisma';
import type { AuthUser } from '../../../common/security/types';

export interface PropertyOwnership {
  ownerUserId: string;
  agencyId: string | null;
  assignedAgentId: string | null;
}

/** Quien puede hacer que con una propiedad (equivale a las Policies de Laravel). */
@Injectable()
export class PropertyPolicyService {
  constructor(private readonly prisma: PrismaService) {}

  /** Membresia aceptada del usuario en una agencia (o null). */
  membership(userId: string, agencyId?: string): Promise<AgencyMember | null> {
    return this.prisma.agencyMember.findFirst({
      where: { userId, invitationStatus: 'ACCEPTED', agencyId },
      orderBy: { createdAt: 'asc' },
    });
  }

  /**
   * Administrador de plataforma, dueno directo, admin de la agencia dueña,
   * o el agente asignado a esa propiedad.
   */
  async canManage(user: AuthUser | undefined, property: PropertyOwnership): Promise<boolean> {
    if (!user) return false;
    if (user.roles.includes(Role.ADMIN) || property.ownerUserId === user.id) return true;
    if (!property.agencyId) return false;

    const member = await this.membership(user.id, property.agencyId);
    if (!member) return false;
    return member.role === 'AGENCY_ADMIN' || property.assignedAgentId === user.id;
  }

  async assertCanManage(user: AuthUser, property: PropertyOwnership): Promise<void> {
    if (!(await this.canManage(user, property))) {
      throw new ForbiddenException('No puedes modificar esta propiedad');
    }
  }

  /** Filtro Prisma de "las propiedades que este usuario puede gestionar" (para listados de gestion). */
  async managedFilter(user: AuthUser): Promise<Prisma.PropertyWhereInput> {
    if (user.roles.includes(Role.ADMIN)) return {};
    const member = await this.membership(user.id);
    const or: Prisma.PropertyWhereInput[] = [{ ownerUserId: user.id }];
    if (member?.role === 'AGENCY_ADMIN') or.push({ agencyId: member.agencyId });
    if (member?.role === 'AGENT') or.push({ agencyId: member.agencyId, assignedAgentId: user.id });
    return { OR: or };
  }

  /** Solo el administrador de la agencia asigna agentes (o un admin de plataforma). */
  async assertCanAssign(user: AuthUser, property: PropertyOwnership): Promise<void> {
    if (user.roles.includes(Role.ADMIN)) return;
    const member = property.agencyId ? await this.membership(user.id, property.agencyId) : null;
    if (member?.role !== 'AGENCY_ADMIN') {
      throw new ForbiddenException('Solo el administrador de la agencia puede asignar agentes');
    }
  }
}
