import { Controller, Delete, Get, HttpCode, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '@/common/security/decorators';
import { AuthGroup } from '@/common/security/groups';
import type { AuthUserContext } from '@/common/security/types';
import type { FavoriteResource, PropertyCardResource } from '@/modules/properties/contracts/resources';
import { PropertiesService } from '@/modules/properties/services/properties.service';

/** Favoritos: cualquier usuario con sesion, sin importar su rol. */
@AuthGroup()
@ApiTags('properties')
@Controller()
export class PropertyFavoritesController {
  constructor(private readonly propertiesService: PropertiesService) {}

  @Get('favorites')
  list(@CurrentUser() user: AuthUserContext): Promise<PropertyCardResource[]> {
    return this.propertiesService.listFavorites(user.id);
  }

  @HttpCode(200)
  @Post(':id/favorite')
  add(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: AuthUserContext): Promise<FavoriteResource> {
    return this.propertiesService.addFavorite(user.id, id);
  }

  @Delete(':id/favorite')
  remove(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: AuthUserContext): Promise<FavoriteResource> {
    return this.propertiesService.removeFavorite(user.id, id);
  }
}
