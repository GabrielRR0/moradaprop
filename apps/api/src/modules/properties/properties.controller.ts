import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ApiBody, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { HttpCache } from '../../support/cache';
import { ImagesSupport } from '../../support/images';
import { CurrentUser, RequestInfo } from '../../common/security/decorators';
import { AuthGroup, PublicGroup, RoleGroup } from '../../common/security/groups';
import { limitPerMinute, RATE_LIMITS } from '../../common/security/rate-limits';
import type { AuthUser, RequestContext } from '../../common/security/types';
import { Audit } from '../audit';
import { CreatePropertyDto } from './dto/create-property.dto';
import { AssignAgentDto, ChangeStatusDto } from './dto/manage-property.dto';
import { MapPropertiesDto, SearchPropertiesDto } from './dto/search-properties.dto';
import { UpdatePropertyDto } from './dto/update-property.dto';
import { PropertiesService } from './services/properties.service';
import { DbSupport } from '../../support/db';

const IMAGE_MIME = ['image/jpeg', 'image/png', 'image/webp'];

/**
 * Controller delgado. Ojo con el orden: las rutas fijas (map, mine, favorites)
 * van ANTES de ":id" para que no se confundan con un id.
 */
@ApiTags('properties')
@Controller()
export class PropertiesController {
  constructor(private readonly propertiesService: PropertiesService) {}

  // ---------------- Lectura publica ----------------

  @PublicGroup()
  @HttpCache('search')
  @Get()
  search(@Query() query: SearchPropertiesDto) {
    return this.propertiesService.searchProperties(query);
  }

  @PublicGroup()
  @HttpCache('map')
  @Get('map')
  map(@Query() query: MapPropertiesDto) {
    return this.propertiesService.mapProperties(query);
  }

  // ---------------- Mis propiedades y favoritos ----------------

  @RoleGroup(DbSupport.Role.OWNER, DbSupport.Role.AGENCY, DbSupport.Role.ADMIN)
  @Get('mine')
  mine(@CurrentUser() user: AuthUser, @Query('page') page?: string, @Query('limit') limit?: string) {
    return this.propertiesService.mine(user, Math.max(Number(page) || 1, 1), Math.min(Number(limit) || 20, 50));
  }

  @AuthGroup()
  @Get('favorites')
  favorites(@CurrentUser() user: AuthUser) {
    return this.propertiesService.listFavorites(user.id);
  }

  @PublicGroup()
  @Get(':id')
  detail(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: AuthUser | undefined) {
    return this.propertiesService.detail(id, user);
  }

  // ---------------- Publicar y gestionar ----------------

  @RoleGroup(DbSupport.Role.OWNER, DbSupport.Role.AGENCY)
  @Audit('properties.create', 'Property')
  @Post()
  create(@Body() dto: CreatePropertyDto, @CurrentUser() user: AuthUser, @RequestInfo() ctx: RequestContext) {
    return this.propertiesService.create(user, dto, ctx);
  }

  @RoleGroup(DbSupport.Role.OWNER, DbSupport.Role.AGENCY, DbSupport.Role.ADMIN)
  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdatePropertyDto,
    @CurrentUser() user: AuthUser,
    @RequestInfo() ctx: RequestContext,
  ) {
    return this.propertiesService.update(user, id, dto, ctx);
  }

  @RoleGroup(DbSupport.Role.OWNER, DbSupport.Role.AGENCY, DbSupport.Role.ADMIN)
  @Patch(':id/status')
  changeStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ChangeStatusDto,
    @CurrentUser() user: AuthUser,
    @RequestInfo() ctx: RequestContext,
  ) {
    return this.propertiesService.changeStatus(user, id, dto.status, ctx);
  }

  @RoleGroup(DbSupport.Role.AGENCY, DbSupport.Role.ADMIN)
  @Patch(':id/agent')
  assignAgent(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AssignAgentDto,
    @CurrentUser() user: AuthUser,
    @RequestInfo() ctx: RequestContext,
  ) {
    return this.propertiesService.assignAgent(user, id, dto.agentUserId, ctx);
  }

  @RoleGroup(DbSupport.Role.OWNER, DbSupport.Role.AGENCY, DbSupport.Role.ADMIN)
  @HttpCode(204)
  @Delete(':id')
  async remove(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: AuthUser, @RequestInfo() ctx: RequestContext) {
    await this.propertiesService.remove(user, id, ctx);
  }

  // ---------------- Imagenes ----------------

  @RoleGroup(DbSupport.Role.OWNER, DbSupport.Role.AGENCY, DbSupport.Role.ADMIN)
  @Throttle(limitPerMinute(RATE_LIMITS.upload))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: { type: 'object', properties: { files: { type: 'array', items: { type: 'string', format: 'binary' } } } },
  })
  @UseInterceptors(
    FilesInterceptor('files', 10, {
      // Sin "storage": multer usa memoria, nada se escribe en disco antes de validar.
      limits: { fileSize: ImagesSupport.MAX_BYTES, files: 10, fields: 0, parts: 12 },
      fileFilter: (_req, file, cb) =>
        IMAGE_MIME.includes(file.mimetype)
          ? cb(null, true)
          : cb(new BadRequestException('Solo se permiten imagenes JPG, PNG o WebP'), false),
    }),
  )
  @Post(':id/images')
  uploadImages(
    @Param('id', ParseUUIDPipe) id: string,
    @UploadedFiles() files: Express.Multer.File[],
    @CurrentUser() user: AuthUser,
    @RequestInfo() ctx: RequestContext,
  ) {
    return this.propertiesService.uploadImages(user, id, files, ctx);
  }

  @RoleGroup(DbSupport.Role.OWNER, DbSupport.Role.AGENCY, DbSupport.Role.ADMIN)
  @HttpCode(204)
  @Delete(':id/images/:imageId')
  async removeImage(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('imageId', ParseUUIDPipe) imageId: string,
    @CurrentUser() user: AuthUser,
    @RequestInfo() ctx: RequestContext,
  ) {
    await this.propertiesService.removeImage(user, id, imageId, ctx);
  }

  @RoleGroup(DbSupport.Role.OWNER, DbSupport.Role.AGENCY, DbSupport.Role.ADMIN)
  @Patch(':id/images/:imageId/cover')
  setCover(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('imageId', ParseUUIDPipe) imageId: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.propertiesService.setCover(user, id, imageId);
  }

  // ---------------- Favoritos ----------------

  @AuthGroup()
  @HttpCode(200)
  @Post(':id/favorite')
  addFavorite(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: AuthUser) {
    return this.propertiesService.addFavorite(user.id, id);
  }

  @AuthGroup()
  @Delete(':id/favorite')
  removeFavorite(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: AuthUser) {
    return this.propertiesService.removeFavorite(user.id, id);
  }
}
