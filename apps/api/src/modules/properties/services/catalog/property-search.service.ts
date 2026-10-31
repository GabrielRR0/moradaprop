import { Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '@/common/prisma';
import { STORAGE_PROVIDER, type StorageProvider } from '@/common/storage';
import { CacheSupport } from '@/support/cache';
import { DbSupport } from '@/support/db';
import { PropertySort, type SearchPropertiesDto } from '../../contracts/dto/search-properties.dto';
import type { PropertyListResource } from '../../contracts/resources';
import { cacheKey } from '../../utils/cache-key';
import { buildPropertyWhere } from '../../utils/property-filters';
import { cardInclude, toCard } from '../../utils/property-mapper';

/** Busqueda publica con filtros y orden. Es igual para todos los usuarios, por eso se cachea unos segundos. */
@Injectable()
export class PropertySearchService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: CacheSupport.Service,
    @Inject(STORAGE_PROVIDER) private readonly storage: StorageProvider,
  ) {}

  search(query: SearchPropertiesDto): Promise<PropertyListResource> {
    return this.cache.remember(cacheKey('search', query), () => this.searchInDatabase(query), CacheSupport.POLICIES.search);
  }

  private async searchInDatabase(query: SearchPropertiesDto): Promise<PropertyListResource> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const where = buildPropertyWhere(query);

    const [rows, total] = await this.prisma.$transaction([
      this.prisma.property.findMany({
        where,
        include: cardInclude,
        orderBy: this.orderBy(query.sort),
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.property.count({ where }),
    ]);
    return { items: rows.map((row) => toCard(row, this.storage)), total, page, limit };
  }

  private orderBy(sort?: PropertySort): DbSupport.Prisma.PropertyOrderByWithRelationInput[] {
    switch (sort) {
      case PropertySort.PRICE_ASC:
        return [{ priceAmount: 'asc' }];
      case PropertySort.PRICE_DESC:
        return [{ priceAmount: 'desc' }];
      default:
        return [{ publishedAt: { sort: 'desc', nulls: 'last' } }, { createdAt: 'desc' }];
    }
  }
}
