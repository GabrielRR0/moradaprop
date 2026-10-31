import { Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '@/common/prisma';
import type { AuthUserContext } from '@/common/security/types';
import { STORAGE_PROVIDER, type StorageProvider } from '@/common/storage';
import type { PropertyListResource } from '../../contracts/resources';
import { cardInclude, toCard } from '../../utils/property-mapper';
import { PropertyPolicyService } from '../access/property-policy.service';

/** "Mis propiedades": las que el usuario gestiona, en cualquier estado. */
@Injectable()
export class PropertyMineService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly policy: PropertyPolicyService,
    @Inject(STORAGE_PROVIDER) private readonly storage: StorageProvider,
  ) {}

  async mine(user: AuthUserContext, page = 1, limit = 20): Promise<PropertyListResource> {
    const where = await this.policy.managedFilter(user);
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.property.findMany({
        where,
        include: cardInclude,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.property.count({ where }),
    ]);
    return { items: rows.map((row) => toCard(row, this.storage)), total, page, limit };
  }
}
