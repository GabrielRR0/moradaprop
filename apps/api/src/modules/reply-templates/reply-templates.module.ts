import { Module } from '@nestjs/common';
import { SecurityModule } from '@/modules/security';
import { ReplyTemplatesController } from './controllers/private/publisher/reply-templates.controller';
import { ReplyTemplatePolicy } from './services/access/reply-template.policy';
import { ReplyTemplateCatalogService } from './services/catalog/reply-template-catalog.service';
import { ReplyTemplateWriteService } from './services/management/reply-template-write.service';
import { ReplyTemplatesService } from './services/reply-templates.service';

@Module({
  imports: [SecurityModule],
  controllers: [ReplyTemplatesController],
  providers: [ReplyTemplatesService, ReplyTemplateCatalogService, ReplyTemplateWriteService, ReplyTemplatePolicy],
  exports: [ReplyTemplatesService],
})
export class ReplyTemplatesModule {}
