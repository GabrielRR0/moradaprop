import { Module } from '@nestjs/common';
import { PropertiesModule } from '../properties';
import { SecurityModule } from '../security';
import { ImportsController } from './imports.controller';
import { ImportProcessorService } from './services/import-processor.service';
import { ImportQueryService } from './services/import-query.service';
import { ImportTemplateService } from './services/import-template.service';
import { ImportUploadService } from './services/import-upload.service';
import { ImportsService } from './services/imports.service';

@Module({
  imports: [PropertiesModule, SecurityModule],
  controllers: [ImportsController],
  providers: [ImportsService, ImportUploadService, ImportProcessorService, ImportQueryService, ImportTemplateService],
  exports: [ImportsService],
})
export class ImportsModule {}
