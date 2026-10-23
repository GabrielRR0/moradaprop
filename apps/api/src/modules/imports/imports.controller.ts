import {
  BadRequestException,
  Controller,
  Get,
  Header,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  StreamableFile,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBody, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Role } from '@prisma/client';
import { CurrentUser, RequestInfo } from '../../common/security/decorators';
import { RoleGroup } from '../../common/security/groups';
import { limitPerMinute, RATE_LIMITS } from '../../common/security/rate-limits';
import type { AuthUser, RequestContext } from '../../common/security/types';
import { ImportsService } from './services/imports.service';
import { MAX_IMPORT_BYTES } from './services/import-upload.service';

const SHEET_MIME = [
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/csv',
  'application/csv',
  'application/vnd.ms-excel', // algunos navegadores envian esto para .csv
  'text/plain',
];

/** Solo agencias. La agencia sale del token; las rutas fijas (template) van antes que ":id". */
@ApiTags('imports')
@RoleGroup(Role.AGENCY)
@Controller()
export class ImportsController {
  constructor(private readonly importsService: ImportsService) {}

  @Get('template.xlsx')
  @Header('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
  @Header('Content-Disposition', 'attachment; filename="plantilla-propiedades.xlsx"')
  async templateXlsx() {
    return new StreamableFile(await this.importsService.templateXlsx());
  }

  @Get('template.csv')
  @Header('Content-Type', 'text/csv; charset=utf-8')
  @Header('Content-Disposition', 'attachment; filename="plantilla-propiedades.csv"')
  templateCsv() {
    return new StreamableFile(this.importsService.templateCsv());
  }

  @Throttle(limitPerMinute(RATE_LIMITS.import))
  @HttpCode(201)
  @ApiConsumes('multipart/form-data')
  @ApiBody({ schema: { type: 'object', properties: { file: { type: 'string', format: 'binary' } } } })
  @UseInterceptors(
    FileInterceptor('file', {
      // Memoria: nada toca el disco hasta validar el contenido real del archivo.
      limits: { fileSize: MAX_IMPORT_BYTES, files: 1, fields: 0, parts: 2 },
      fileFilter: (_req, file, cb) =>
        SHEET_MIME.includes(file.mimetype) ? cb(null, true) : cb(new BadRequestException('Sube un archivo .xlsx o .csv'), false),
    }),
  )
  @Post()
  upload(@UploadedFile() file: Express.Multer.File | undefined, @CurrentUser() user: AuthUser, @RequestInfo() ctx: RequestContext) {
    return this.importsService.upload(user, file, ctx);
  }

  @Get()
  list(@CurrentUser() user: AuthUser, @Query('page') page?: string, @Query('limit') limit?: string) {
    return this.importsService.list(user, Math.max(Number(page) || 1, 1), Math.min(Number(limit) || 20, 50));
  }

  @Get(':id')
  detail(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: AuthUser) {
    return this.importsService.detail(user, id);
  }
}
