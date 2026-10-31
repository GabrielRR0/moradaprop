import { Controller, Get, Param, ParseUUIDPipe, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CacheSupport } from '@/support/cache';
import { CurrentUser } from '@/common/security/decorators';
import { PublicGroup } from '@/common/security/groups';
import type { AuthUserContext } from '@/common/security/types';
import { MapPropertiesDto, SearchPropertiesDto } from '../../contracts/dto/search-properties.dto';
import type { PropertyDetailResource, PropertyListResource, PropertyMapResource, RentStatsResource } from '../../contracts/resources';
import { PropertiesService } from '../../services/properties.service';

/** Lectura publica: cualquiera puede buscar y ver propiedades, con o sin sesion. */
@PublicGroup()
@ApiTags('properties')
@Controller()
export class PropertiesController {
  constructor(private readonly propertiesService: PropertiesService) {}

  @CacheSupport.HttpCache('search')
  @Get()
  search(@Query() query: SearchPropertiesDto): Promise<PropertyListResource> {
    return this.propertiesService.searchProperties(query);
  }

  @CacheSupport.HttpCache('map')
  @Get('map')
  map(@Query() query: MapPropertiesDto): Promise<PropertyMapResource> {
    return this.propertiesService.mapProperties(query);
  }

  @CacheSupport.HttpCache('rentStats')
  @Get('rent-stats')
  rentStats(): Promise<RentStatsResource> {
    return this.propertiesService.rentStats();
  }

  /** ":id" va despues de las rutas fijas; ver el orden de controllers en properties.module.ts. */
  @Get(':id')
  detail(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthUserContext | undefined,
  ): Promise<PropertyDetailResource> {
    return this.propertiesService.detail(id, user);
  }
}
