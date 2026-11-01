import { Injectable } from '@nestjs/common';
import type { AuthUserContext, RequestContext } from '@/common/security/types';
import type { CreateReplyTemplateDto } from '../contracts/dto/create-reply-template.dto';
import type { UpdateReplyTemplateDto } from '../contracts/dto/update-reply-template.dto';
import { ReplyTemplateCatalogService } from './catalog/reply-template-catalog.service';
import { ReplyTemplateWriteService } from './management/reply-template-write.service';

/** Fachada del modulo: el controller solo habla con este service. */
@Injectable()
export class ReplyTemplatesService {
  constructor(
    private readonly catalog: ReplyTemplateCatalogService,
    private readonly writer: ReplyTemplateWriteService,
  ) {}

  list(user: AuthUserContext) {
    return this.catalog.list(user);
  }
  create(user: AuthUserContext, dto: CreateReplyTemplateDto, ctx: RequestContext) {
    return this.writer.create(user, dto, ctx);
  }
  update(user: AuthUserContext, id: string, dto: UpdateReplyTemplateDto, ctx: RequestContext) {
    return this.writer.update(user, id, dto, ctx);
  }
  remove(user: AuthUserContext, id: string, ctx: RequestContext) {
    return this.writer.remove(user, id, ctx);
  }
}
