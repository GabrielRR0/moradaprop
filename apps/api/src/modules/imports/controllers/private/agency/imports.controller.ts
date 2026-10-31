import { Controller, Get, HttpCode, Param, ParseUUIDPipe, Post, Query, UploadedFile } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CurrentUser, RequestInfo } from '@/common/security/decorators';
import { AgencyGroup } from '@/common/security/groups';
import type { AuthUserContext, RequestContext } from '@/common/security/types';
import { ListImportsDto } from '@/modules/imports/contracts/dto/list-imports.dto';
import type { ImportJobListResource, ImportJobResource } from '@/modules/imports/contracts/resources';
import { UploadImportFile } from '@/modules/imports/decorators/upload-import-file.decorator';
import { ImportsService } from '@/modules/imports/services/imports.service';

/** Solo agencias. La agencia sale del token. */
@AgencyGroup()
@ApiTags('imports')
@Controller()
export class ImportsController {
  constructor(private readonly importsService: ImportsService) {}

  @UploadImportFile()
  @HttpCode(201)
  @Post()
  upload(
    @UploadedFile() file: Express.Multer.File | undefined,
    @CurrentUser() user: AuthUserContext,
    @RequestInfo() ctx: RequestContext,
  ): Promise<ImportJobResource> {
    return this.importsService.upload(user, file, ctx);
  }

  @Get()
  list(@Query() query: ListImportsDto, @CurrentUser() user: AuthUserContext): Promise<ImportJobListResource> {
    return this.importsService.list(user, query.page, query.limit);
  }

  @Get(':id')
  detail(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: AuthUserContext): Promise<ImportJobResource> {
    return this.importsService.detail(user, id);
  }
}
