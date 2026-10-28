import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, PropertyStatus } from '@prisma/client';
import { CACHE_POLICIES, CacheService } from '../../../support/cache';
import { PrismaService } from '../../../common/prisma';
import type { AuthUser } from '../../../common/security/types';
import { UserVault } from '../../security';
import { STORAGE_PROVIDER, type StorageProvider } from '../../../common/storage';
import {
  PropertySort,
  type MapPropertiesDto,
  type PropertyFiltersDto,
  type SearchPropertiesDto,
} from '../dto/search-properties.dto';
import { snapBox } from '../utils/bounding-box';
import { cacheKey } from '../utils/cache-key';
import { clusterPoints, POINTS_FROM_ZOOM, type MapPoint } from '../utils/clusters';
import { cardInclude, detailInclude, toCard, toDetail } from '../utils/property-mapper';
import { PropertyPolicyService } from './property-policy.service';

/** Estados que aparecen en busquedas publicas: la reservada sigue visible con su insignia. */
const PUBLIC_SEARCH_STATUSES: PropertyStatus[] = [PropertyStatus.PUBLICADA, PropertyStatus.RESERVADA];
/** La alquilada ya no se ofrece, pero su ficha sigue abierta (enlaces compartidos). */
const PUBLIC_DETAIL_STATUSES: PropertyStatus[] = [...PUBLIC_SEARCH_STATUSES, PropertyStatus.ALQUILADA];
/** Tope de pines por consulta de mapa alejado (se agrupan en clusters) y de mapa cercano (pines sueltos). */
const MAP_POINT_LIMIT = 5000;
const MAP_CLOSE_LIMIT = 500;

@Injectable()
export class PropertySearchService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly policy: PropertyPolicyService,
    private readonly cache: CacheService,
    private readonly vault: UserVault,
    @Inject(STORAGE_PROVIDER) private readonly storage: StorageProvider,
  ) {}

  /** Busqueda publica. Es igual para todos los usuarios, por eso se puede cachear unos segundos. */
  search(query: SearchPropertiesDto) {
    return this.cache.remember(cacheKey('search', query), () => this.searchInDatabase(query), CACHE_POLICIES.search);
  }

  private async searchInDatabase(query: SearchPropertiesDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const where = this.buildWhere(query);

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

  /**
   * Pines del mapa: agrupados por zona segun el zoom, o sueltos al acercarse.
   * El cuadro se ajusta a una cuadricula para que usuarios que miran la misma zona compartan cache.
   */
  map(query: MapPropertiesDto) {
    const zoom = query.zoom ?? 10;
    const filters = { ...snapBox(query, zoom), zoom };
    return this.cache.remember(cacheKey('map', filters), () => this.mapInDatabase(filters, zoom), CACHE_POLICIES.map);
  }

  private async mapInDatabase(filters: MapPropertiesDto, zoom: number) {
    // De cerca se muestran pines sueltos (pocos); de lejos se agrupan y se leen mas filas.
    const limit = zoom >= POINTS_FROM_ZOOM ? MAP_CLOSE_LIMIT : MAP_POINT_LIMIT;
    const rows = await this.prisma.property.findMany({
      where: this.buildWhere(filters),
      select: { id: true, latitude: true, longitude: true, priceAmount: true, currency: true, status: true },
      take: limit,
    });
    const points: MapPoint[] = rows.map((row) => ({ ...row, priceAmount: Number(row.priceAmount) }));
    return { zoom, total: points.length, truncated: points.length === limit, markers: clusterPoints(points, zoom) };
  }

  /** Ficha completa. La pausada solo la ven quienes la gestionan (para el resto no existe). */
  async detail(id: string, user: AuthUser | undefined) {
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

  /** Propiedades que el usuario gestiona, en cualquier estado. */
  async mine(user: AuthUser, page = 1, limit = 20) {
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

  private buildWhere(f: PropertyFiltersDto): Prisma.PropertyWhereInput {
    const hasPrice = f.minPrice !== undefined || f.maxPrice !== undefined;
    const insensitive = (value: string) => ({ equals: value, mode: 'insensitive' as const });

    return {
      status: { in: PUBLIC_SEARCH_STATUSES },
      state: f.state ? insensitive(f.state) : undefined,
      municipality: f.municipality ? insensitive(f.municipality) : undefined,
      urbanization: f.urbanization ? { contains: f.urbanization, mode: 'insensitive' } : undefined,
      type: f.type,
      // El rango de precio solo tiene sentido dentro de una moneda: USD por defecto.
      currency: f.currency ?? (hasPrice ? 'USD' : undefined),
      priceAmount: hasPrice ? { gte: f.minPrice, lte: f.maxPrice } : undefined,
      bedrooms: f.bedrooms === undefined ? undefined : { gte: f.bedrooms },
      bathrooms: f.bathrooms === undefined ? undefined : { gte: f.bathrooms },
      parkingSpots: f.parkingSpots === undefined ? undefined : { gte: f.parkingSpots },
      // Una amenity se filtra solo cuando se pide (true); false significa "me da igual".
      hasGenerator: f.hasGenerator ? true : undefined,
      hasWaterTank: f.hasWaterTank ? true : undefined,
      hasFiberOptic: f.hasFiberOptic ? true : undefined,
      hasSecurity: f.hasSecurity ? true : undefined,
      latitude: f.swLat !== undefined && f.neLat !== undefined ? { gte: f.swLat, lte: f.neLat } : undefined,
      longitude: f.swLng !== undefined && f.neLng !== undefined ? { gte: f.swLng, lte: f.neLng } : undefined,
      OR: f.q
        ? [
            { title: { contains: f.q, mode: 'insensitive' } },
            { description: { contains: f.q, mode: 'insensitive' } },
            { urbanization: { contains: f.q, mode: 'insensitive' } },
            { municipality: { contains: f.q, mode: 'insensitive' } },
          ]
        : undefined,
    };
  }

  private orderBy(sort?: PropertySort): Prisma.PropertyOrderByWithRelationInput[] {
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
