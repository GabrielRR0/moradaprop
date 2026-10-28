import { ParseUUIDPipe } from '@nestjs/common';
import { Args, ID, Int, Query, Resolver } from '@nestjs/graphql';
import { CurrentUser } from '../../common/security/decorators';
import { PublicGroup, RoleGroup } from '../../common/security/groups';
import type { AuthUser } from '../../common/security/types';
import { toGraphqlMarker } from './graphql/map-marker.mapper';
import { MapPropertiesArgs, SearchPropertiesArgs } from './graphql/property.args';
import { PropertyDetailType, PropertyMapType, PropertyPageType } from './graphql/property.types';
import { PropertiesService } from './services/properties.service';
import { DbSupport } from '../../support/db';

/**
 * GraphQL solo para LECTURA (busqueda, ficha, mapa, mis propiedades): donde conviene pedir justo los
 * campos necesarios. Escribir sigue siendo REST. Resolver delgado: igual que el controller, solo llama al service.
 * Pasa por los mismos guards globales (origen de la app, bloqueos, rate limit, JWT, roles).
 */
@Resolver()
export class PropertiesResolver {
  constructor(private readonly propertiesService: PropertiesService) {}

  @PublicGroup()
  @Query(() => PropertyPageType, { name: 'properties', description: 'Busqueda con filtros y paginacion' })
  search(@Args() args: SearchPropertiesArgs) {
    return this.propertiesService.searchProperties(args);
  }

  @PublicGroup()
  @Query(() => PropertyDetailType, { name: 'property', description: 'Ficha completa de una propiedad' })
  detail(@Args('id', { type: () => ID }, ParseUUIDPipe) id: string, @CurrentUser() user: AuthUser | undefined) {
    return this.propertiesService.detail(id, user);
  }

  @PublicGroup()
  @Query(() => PropertyMapType, { name: 'propertyMap', description: 'Pines del mapa agrupados segun el zoom' })
  async map(@Args() args: MapPropertiesArgs) {
    const result = await this.propertiesService.mapProperties(args);
    return { ...result, markers: result.markers.map(toGraphqlMarker) };
  }

  @RoleGroup(DbSupport.Role.OWNER, DbSupport.Role.AGENCY, DbSupport.Role.ADMIN)
  @Query(() => PropertyPageType, { name: 'myProperties', description: 'Propiedades que gestiono, en cualquier estado' })
  mine(
    @CurrentUser() user: AuthUser,
    @Args('page', { type: () => Int, nullable: true }) page?: number,
    @Args('limit', { type: () => Int, nullable: true }) limit?: number,
  ) {
    return this.propertiesService.mine(user, Math.max(page ?? 1, 1), Math.min(limit ?? 20, 50));
  }
}
