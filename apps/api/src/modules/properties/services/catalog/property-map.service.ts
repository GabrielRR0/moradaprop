import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/common/prisma';
import { CacheSupport } from '@/support/cache';
import type { MapPropertiesDto } from '../../contracts/dto/search-properties.dto';
import type { PropertyMapResource } from '../../contracts/resources';
import { snapBox } from '../../utils/bounding-box';
import { cacheKey } from '../../utils/cache-key';
import { clusterPoints, POINTS_FROM_ZOOM, type MapPoint } from '../../utils/clusters';
import { buildPropertyWhere } from '../../utils/property-filters';

/** Tope de pines por consulta de mapa alejado (se agrupan en clusters) y de mapa cercano (pines sueltos). */
const MAP_POINT_LIMIT = 5000;
const MAP_CLOSE_LIMIT = 500;

/** Pines del mapa, agrupados por zona segun el zoom o sueltos al acercarse. */
@Injectable()
export class PropertyMapService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: CacheSupport.Service,
  ) {}

  /**
   * El cuadro se ajusta a una cuadricula para que usuarios que miran la misma zona compartan cache.
   */
  map(query: MapPropertiesDto): Promise<PropertyMapResource> {
    const zoom = query.zoom ?? 10;
    const filters = { ...snapBox(query, zoom), zoom };
    return this.cache.remember(cacheKey('map', filters), () => this.mapInDatabase(filters, zoom), CacheSupport.POLICIES.map);
  }

  private async mapInDatabase(filters: MapPropertiesDto, zoom: number): Promise<PropertyMapResource> {
    // De cerca se muestran pines sueltos (pocos); de lejos se agrupan y se leen mas filas.
    const limit = zoom >= POINTS_FROM_ZOOM ? MAP_CLOSE_LIMIT : MAP_POINT_LIMIT;
    const rows = await this.prisma.property.findMany({
      where: buildPropertyWhere(filters),
      select: { id: true, latitude: true, longitude: true, priceAmount: true, currency: true, status: true },
      take: limit,
    });
    const points: MapPoint[] = rows.map((row) => ({ ...row, priceAmount: Number(row.priceAmount) }));
    return { zoom, total: points.length, truncated: points.length === limit, markers: clusterPoints(points, zoom) };
  }
}
