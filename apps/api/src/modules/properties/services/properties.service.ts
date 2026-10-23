import { Injectable } from '@nestjs/common';
import type { PropertyStatus } from '@prisma/client';
import type { AuthUser, RequestContext } from '../../../common/security/types';
import type { CreatePropertyDto } from '../dto/create-property.dto';
import type { MapPropertiesDto, SearchPropertiesDto } from '../dto/search-properties.dto';
import type { UpdatePropertyDto } from '../dto/update-property.dto';
import { PropertyFavoritesService } from './property-favorites.service';
import { PropertyImagesService } from './property-images.service';
import { PropertySearchService } from './property-search.service';
import { PropertyWriteService } from './property-write.service';

/** Fachada del modulo: controller y resolver solo hablan con este service. */
@Injectable()
export class PropertiesService {
  constructor(
    private readonly search: PropertySearchService,
    private readonly writer: PropertyWriteService,
    private readonly images: PropertyImagesService,
    private readonly favorites: PropertyFavoritesService,
  ) {}

  // Lectura
  searchProperties(query: SearchPropertiesDto) {
    return this.search.search(query);
  }
  mapProperties(query: MapPropertiesDto) {
    return this.search.map(query);
  }
  detail(id: string, user: AuthUser | undefined) {
    return this.search.detail(id, user);
  }
  mine(user: AuthUser, page?: number, limit?: number) {
    return this.search.mine(user, page, limit);
  }

  // Escritura
  async create(user: AuthUser, dto: CreatePropertyDto, ctx: RequestContext) {
    const property = await this.writer.create(user, dto, ctx);
    return this.search.detail(property.id, user);
  }
  async update(user: AuthUser, id: string, dto: UpdatePropertyDto, ctx: RequestContext) {
    await this.writer.update(user, id, dto, ctx);
    return this.search.detail(id, user);
  }
  async changeStatus(user: AuthUser, id: string, status: PropertyStatus, ctx: RequestContext) {
    await this.writer.changeStatus(user, id, status, ctx);
    return this.search.detail(id, user);
  }
  async assignAgent(user: AuthUser, id: string, agentUserId: string, ctx: RequestContext) {
    await this.writer.assignAgent(user, id, agentUserId, ctx);
    return this.search.detail(id, user);
  }
  remove(user: AuthUser, id: string, ctx: RequestContext) {
    return this.writer.remove(user, id, ctx);
  }

  // Imagenes
  uploadImages(user: AuthUser, id: string, files: Express.Multer.File[], ctx: RequestContext) {
    return this.images.upload(user, id, files, ctx);
  }
  removeImage(user: AuthUser, id: string, imageId: string, ctx: RequestContext) {
    return this.images.remove(user, id, imageId, ctx);
  }
  setCover(user: AuthUser, id: string, imageId: string) {
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
