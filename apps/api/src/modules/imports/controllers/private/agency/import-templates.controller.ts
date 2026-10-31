import { Controller, Get, Header, StreamableFile } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AgencyGroup } from '@/common/security/groups';
import { ImportsService } from '@/modules/imports/services/imports.service';

/** Plantillas descargables. Van antes que ":id" (ver el orden de controllers en imports.module.ts). */
@AgencyGroup()
@ApiTags('imports')
@Controller()
export class ImportTemplatesController {
  constructor(private readonly importsService: ImportsService) {}

  @Header('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
  @Header('Content-Disposition', 'attachment; filename="plantilla-propiedades.xlsx"')
  @Get('template.xlsx')
  async templateXlsx() {
    return new StreamableFile(await this.importsService.templateXlsx());
  }

  @Header('Content-Type', 'text/csv; charset=utf-8')
  @Header('Content-Disposition', 'attachment; filename="plantilla-propiedades.csv"')
  @Get('template.csv')
  templateCsv() {
    return new StreamableFile(this.importsService.templateCsv());
  }
}
