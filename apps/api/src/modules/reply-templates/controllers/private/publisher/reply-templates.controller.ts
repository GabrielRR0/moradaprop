import { Body, Controller, Delete, Get, HttpCode, Param, ParseUUIDPipe, Patch, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CurrentUser, RequestInfo } from '@/common/security/decorators';
import { PublisherGroup } from '@/common/security/groups';
import type { AuthUserContext, RequestContext } from '@/common/security/types';
import { CreateReplyTemplateDto } from '@/modules/reply-templates/contracts/dto/create-reply-template.dto';
import { UpdateReplyTemplateDto } from '@/modules/reply-templates/contracts/dto/update-reply-template.dto';
import type { ReplyTemplateListResource, ReplyTemplateResource } from '@/modules/reply-templates/contracts/resources';
import { ReplyTemplatesService } from '@/modules/reply-templates/services/reply-templates.service';

/** Textos reutilizables de quien responde mensajes: los propios y los que comparte su inmobiliaria. */
@PublisherGroup()
@ApiTags('reply-templates')
@Controller()
export class ReplyTemplatesController {
  constructor(private readonly replyTemplatesService: ReplyTemplatesService) {}

  @Get()
  list(@CurrentUser() user: AuthUserContext): Promise<ReplyTemplateListResource> {
    return this.replyTemplatesService.list(user);
  }

  @Post()
  create(
    @Body() dto: CreateReplyTemplateDto,
    @CurrentUser() user: AuthUserContext,
    @RequestInfo() ctx: RequestContext,
  ): Promise<ReplyTemplateResource> {
    return this.replyTemplatesService.create(user, dto, ctx);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateReplyTemplateDto,
    @CurrentUser() user: AuthUserContext,
    @RequestInfo() ctx: RequestContext,
  ): Promise<ReplyTemplateResource> {
    return this.replyTemplatesService.update(user, id, dto, ctx);
  }

  @HttpCode(204)
  @Delete(':id')
  async remove(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: AuthUserContext, @RequestInfo() ctx: RequestContext) {
    await this.replyTemplatesService.remove(user, id, ctx);
  }
}
