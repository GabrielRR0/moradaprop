import { Module } from '@nestjs/common';
import { PropertiesModule } from '@/modules/properties';
import { SecurityModule } from '@/modules/security';
import { ImportTemplatesController } from './controllers/private/agency/import-templates.controller';
import { ImportsController } from './controllers/private/agency/imports.controller';
import { ImportQueryService } from './services/history/import-query.service';
import { ImportsService } from './services/imports.service';
import { ImportProcessorService } from './services/intake/import-processor.service';
import { ImportUploadService } from './services/intake/import-upload.service';
import { ImportTemplateService } from './services/templates/import-template.service';

@Module({
  imports: [PropertiesModule, SecurityModule],
  // El orden importa: las plantillas (template.xlsx, template.csv) se registran antes que GET ":id".
  controllers: [ImportTemplatesController, ImportsController],
  providers: [
    ImportsService,
    // intake/: recibir y procesar la planilla
    ImportUploadService,
    ImportProcessorService,
    // history/ y templates/
    ImportQueryService,
    ImportTemplateService,
  ],
  exports: [ImportsService],
})
export class ImportsModule {}
