import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/common/prisma';
import type { AuthUserContext } from '@/common/security/types';
import { STORAGE_PROVIDER, type StorageProvider } from '@/common/storage';
import { UserVault } from '@/modules/security';
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
    return toDetail({ ...row, owner: this.vault.decode(row.owner) }, this.storage, { isFavorite: Boolean(favorite), canManage });
  }
}
