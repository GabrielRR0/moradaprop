import { Injectable } from '@nestjs/common';
import type { AuthUserContext, RequestContext } from '@/common/security/types';
import { DbSupport } from '@/support/db';
import type { CreatePropertyDto } from '../contracts/dto/create-property.dto';
import type { MapPropertiesDto, SearchPropertiesDto } from '../contracts/dto/search-properties.dto';
import type { UpdatePropertyDto } from '../contracts/dto/update-property.dto';
import type { PropertyDetailResource } from '../contracts/resources';
import { PropertyDetailService } from './catalog/property-detail.service';
import { PropertyMapService } from './catalog/property-map.service';
import { PropertyRentStatsService } from './catalog/property-rent-stats.service';
import { PropertySearchService } from './catalog/property-search.service';
import { PropertyFavoritesService } from './favorites/property-favorites.service';
import { PropertyImagesService } from './images/property-images.service';
import { PropertyMineService } from './management/property-mine.service';
import { PropertyWriteService } from './management/property-write.service';

/** Fachada del modulo: controller y resolver solo hablan con este service. */
@Injectable()
export class PropertiesService {
  constructor(
    private readonly search: PropertySearchService,
    private readonly map: PropertyMapService,
    private readonly stats: PropertyRentStatsService,
    private readonly details: PropertyDetailService,
    private readonly mineList: PropertyMineService,
    private readonly writer: PropertyWriteService,
    private readonly images: PropertyImagesService,
    private readonly favorites: PropertyFavoritesService,
  ) {}

  // Lectura
  searchProperties(query: SearchPropertiesDto) {
    return this.search.search(query);
  }
  mapProperties(query: MapPropertiesDto) {
    return this.map.map(query);
  }
  rentStats() {
    return this.stats.rentStats();
  }
  detail(id: string, user: AuthUserContext | undefined) {
    return this.details.detail(id, user);
  }
  mine(user: AuthUserContext, page?: number, limit?: number) {
    return this.mineList.mine(user, page, limit);
  }

  // Escritura
  async create(user: AuthUserContext, dto: CreatePropertyDto, ctx: RequestContext): Promise<PropertyDetailResource> {
    const property = await this.writer.create(user, dto, ctx);
    return this.details.detail(property.id, user);
  }
  async update(user: AuthUserContext, id: string, dto: UpdatePropertyDto, ctx: RequestContext): Promise<PropertyDetailResource> {
    await this.writer.update(user, id, dto, ctx);
    return this.details.detail(id, user);
  }
  async changeStatus(
    user: AuthUserContext,
    id: string,
    status: DbSupport.PropertyStatus,
    acceptsVisits: boolean | undefined,
    ctx: RequestContext,
  ): Promise<PropertyDetailResource> {
    await this.writer.changeStatus(user, id, status, acceptsVisits, ctx);
    return this.details.detail(id, user);
  }
  async assignAgent(
    user: AuthUserContext,
    id: string,
    agentUserId: string,
    ctx: RequestContext,
  ): Promise<PropertyDetailResource> {
    await this.writer.assignAgent(user, id, agentUserId, ctx);
    return this.details.detail(id, user);
  }
  remove(user: AuthUserContext, id: string, ctx: RequestContext) {
    return this.writer.remove(user, id, ctx);
  }

  // Imagenes
  uploadImages(user: AuthUserContext, id: string, files: Express.Multer.File[], ctx: RequestContext) {
    return this.images.upload(user, id, files, ctx);
  }
  removeImage(user: AuthUserContext, id: string, imageId: string, ctx: RequestContext) {
    return this.images.remove(user, id, imageId, ctx);
  }
  setCover(user: AuthUserContext, id: string, imageId: string) {
    return this.images.setCover(user, id, imageId);
  }

  // Favoritos
  addFavorite(userId: string, id: string) {
    return this.favorites.add(userId, id);
  }
  removeFavorite(userId: string, id: string) {
    return this.favorites.remove(userId, id);
  }
  listFavorites(userId: string) {
    return this.favorites.list(userId);
  }
}
