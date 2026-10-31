import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/common/prisma';
import { CacheSupport } from '@/support/cache';
import type { RentStatsResource } from '../../contracts/resources';
import { PUBLIC_SEARCH_STATUSES } from '../../utils/property-filters';
import { computeRentStats } from '../../utils/rent-stats';

/**
 * Alquiler típico por estado con TODAS las propiedades publicadas en USD (vivienda: apartamento, casa,
 * townhouse y habitación). Se calcula aquí y se cachea unos minutos porque cambia lento.
 */
@Injectable()
export class PropertyRentStatsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: CacheSupport.Service,
  ) {}

  rentStats(): Promise<RentStatsResource> {
    return this.cache.remember('properties:rent-stats', () => this.rentStatsInDatabase(), CacheSupport.POLICIES.rentStats);
  }

  private async rentStatsInDatabase(): Promise<RentStatsResource> {
    const rows = await this.prisma.property.findMany({
      where: {
        status: { in: PUBLIC_SEARCH_STATUSES },
        currency: 'USD',
        type: { in: ['APARTAMENTO', 'CASA', 'TOWNHOUSE', 'HABITACION'] },
      },
      select: { state: true, priceAmount: true },
    });
    return { states: computeRentStats(rows.map((row) => ({ state: row.state, priceAmount: Number(row.priceAmount) }))) };
  }
}
