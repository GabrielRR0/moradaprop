import { Controller, Delete, HttpCode, Param, ParseUUIDPipe, Patch, Post, UploadedFiles } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CurrentUser, RequestInfo } from '@/common/security/decorators';
import { PublisherGroup } from '@/common/security/groups';
import type { AuthUserContext, RequestContext } from '@/common/security/types';
import { UploadImages } from '@/modules/properties/decorators/upload-images.decorator';
import type { CoverResource, ImagesUploadedResource } from '@/modules/properties/contracts/resources';
import { PropertiesService } from '@/modules/properties/services/properties.service';

/** Fotos de una propiedad: subir, borrar y elegir la portada. Todas las rutas cuelgan de ":id/images". */
@PublisherGroup()
@ApiTags('properties')
@Controller(':id/images')
export class PropertyImagesController {
  constructor(private readonly propertiesService: PropertiesService) {}

  @UploadImages()
  @Post()
  upload(
    @Param('id', ParseUUIDPipe) id: string,
    @UploadedFiles() files: Express.Multer.File[],
    @CurrentUser() user: AuthUserContext,
    @RequestInfo() ctx: RequestContext,
  ): Promise<ImagesUploadedResource> {
    return this.propertiesService.uploadImages(user, id, files, ctx);
  }

  @HttpCode(204)
  @Delete(':imageId')
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('imageId', ParseUUIDPipe) imageId: string,
    @CurrentUser() user: AuthUserContext,
    @RequestInfo() ctx: RequestContext,
  ) {
    await this.propertiesService.removeImage(user, id, imageId, ctx);
  }

  @Patch(':imageId/cover')
  setCover(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('imageId', ParseUUIDPipe) imageId: string,
    @CurrentUser() user: AuthUserContext,
  ): Promise<CoverResource> {
    return this.propertiesService.setCover(user, id, imageId);
  }
}
