import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/common/prisma';
import type { AuthUserContext } from '@/common/security/types';
import { STORAGE_PROVIDER, type StorageProvider } from '@/common/storage';
import { AgencyVault, UserVault } from '@/modules/security';
import type { PropertyDetailResource } from '../../contracts/resources';
import { PUBLIC_DETAIL_STATUSES } from '../../utils/property-filters';
import { detailInclude, toDetail } from '../../utils/property-mapper';
import { PropertyPolicyService } from '../access/property-policy.service';

/** Ficha completa de una propiedad. */
@Injectable()
export class PropertyDetailService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly policy: PropertyPolicyService,
    private readonly vault: UserVault,
    private readonly agencyVault: AgencyVault,
    @Inject(STORAGE_PROVIDER) private readonly storage: StorageProvider,
  ) {}

  /** La pausada solo la ven quienes la gestionan (para el resto no existe). */
  async detail(id: string, user: AuthUserContext | undefined): Promise<PropertyDetailResource> {
    const row = await this.prisma.property.findUnique({ where: { id }, include: detailInclude });
    if (!row) throw new NotFoundException('Propiedad no encontrada');

    const canManage = await this.policy.canManage(user, row);
    if (!canManage && !PUBLIC_DETAIL_STATUSES.includes(row.status)) {
      throw new NotFoundException('Propiedad no encontrada');
    }

    const favorite = user
      ? await this.prisma.favorite.findUnique({ where: { userId_propertyId: { userId: user.id, propertyId: id } } })
      : null;
    const owner = this.vault.decode(row.owner);
    const hasScheduledVisit =
      (await this.prisma.appointment.count({ where: { propertyId: id, type: 'VISITA', status: 'CONFIRMADA', scheduledAt: { gt: new Date() } } })) > 0;
    // El numero de WhatsApp es un dato personal: solo se entrega a quien tiene sesion.
    const whatsapp = user ? this.whatsappOf(row, owner.phone) : null;
    return toDetail({ ...row, owner }, this.storage, { isFavorite: Boolean(favorite), canManage, hasScheduledVisit, whatsapp });
  }

  /** A quien escribirle: el agente asignado, si no el WhatsApp o telefono de la agencia, si no el del dueno. */
  private whatsappOf(row: { agency: { phone: string | null; whatsapp: string | null } | null; assignedAgent: { phone: string | null } | null }, ownerPhone: string | null | undefined): string | null {
    const agent = row.assignedAgent ? this.vault.decode(row.assignedAgent).phone : null;
    const agency = row.agency ? this.agencyVault.decodeProfile(row.agency) : null;
    return agent || agency?.whatsapp || agency?.phone || ownerPhone || null;
  }
}
