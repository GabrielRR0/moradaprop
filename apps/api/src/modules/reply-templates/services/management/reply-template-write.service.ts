import { randomUUID } from 'node:crypto';
import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '@/common/prisma';
import type { AuthUserContext, RequestContext } from '@/common/security/types';
import { AuditService } from '@/modules/audit';
import { OwnershipService, ReplyTemplateVault } from '@/modules/security';
import type { CreateReplyTemplateDto } from '../../contracts/dto/create-reply-template.dto';
import type { UpdateReplyTemplateDto } from '../../contracts/dto/update-reply-template.dto';
import type { ReplyTemplateResource } from '../../contracts/resources';
import { ReplyTemplatePolicy } from '../access/reply-template.policy';
import { ReplyTemplateCatalogService } from '../catalog/reply-template-catalog.service';

/** Cuantos textos privados puede tener una persona y cuantos compartidos una inmobiliaria. */
const MAX_PRIVATE = 50;
const MAX_SHARED = 100;

/** Guardar, editar, compartir y borrar textos reutilizables. Titulo y texto se cifran antes de llegar a la base. */
@Injectable()
export class ReplyTemplateWriteService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly policy: ReplyTemplatePolicy,
    private readonly ownership: OwnershipService,
    private readonly audit: AuditService,
    private readonly vault: ReplyTemplateVault,
    private readonly catalog: ReplyTemplateCatalogService,
  ) {}

  async create(user: AuthUserContext, dto: CreateReplyTemplateDto, context: RequestContext): Promise<ReplyTemplateResource> {
    const agencyId = dto.shared ? await this.teamOf(user) : null;
    await this.assertRoom(user.id, agencyId);

    const created = await this.prisma.replyTemplate.create({
      data: this.vault.encode({ id: randomUUID(), ownerUserId: user.id, agencyId, title: dto.title, body: dto.body }),
    });
    await this.log('reply_templates.created', user, created.id, context, { shared: agencyId !== null });
    return this.catalog.one(user, created.id);
  }

  async update(user: AuthUserContext, id: string, dto: UpdateReplyTemplateDto, context: RequestContext): Promise<ReplyTemplateResource> {
    const current = await this.ownership.require(this.policy, user, id, 'edit', context);

    // Compartir usa la inmobiliaria de quien lo pide; dejarlo privado lo saca del equipo (queda solo para su autor).
    let agencyId = current.agencyId;
    if (dto.shared === true && agencyId === null) agencyId = await this.teamOf(user);
    if (dto.shared === false) agencyId = null;
    if (agencyId !== current.agencyId) await this.assertRoom(current.ownerUserId, agencyId);

    await this.prisma.replyTemplate.update({
      where: { id },
      data: { agencyId, ...this.vault.encode({ id, title: dto.title, body: dto.body }) },
    });
    await this.log('reply_templates.updated', user, id, context, { shared: agencyId !== null });
    return this.catalog.one(user, id);
  }

  async remove(user: AuthUserContext, id: string, context: RequestContext): Promise<void> {
    await this.ownership.require(this.policy, user, id, 'delete', context);
    await this.prisma.replyTemplate.delete({ where: { id } });
    await this.log('reply_templates.deleted', user, id, context);
  }

  /** La inmobiliaria con la que se puede compartir: solo existe para quien pertenece a una. */
  private async teamOf(user: AuthUserContext): Promise<string> {
    const team = await this.policy.membership(user.id);
    if (!team) throw new BadRequestException('Solo quien pertenece a una inmobiliaria puede compartir textos con su equipo');
    return team.agencyId;
  }

  private async assertRoom(ownerUserId: string, agencyId: string | null): Promise<void> {
    if (agencyId) {
      if ((await this.prisma.replyTemplate.count({ where: { agencyId } })) >= MAX_SHARED) {
        throw new BadRequestException(`Tu equipo ya tiene ${MAX_SHARED} textos compartidos: borra alguno para guardar otro`);
      }
    } else if ((await this.prisma.replyTemplate.count({ where: { ownerUserId, agencyId: null } })) >= MAX_PRIVATE) {
      throw new BadRequestException(`Ya tienes ${MAX_PRIVATE} textos privados: borra alguno para guardar otro`);
    }
  }

  // La auditoria guarda quien y que paso, nunca el texto.
  private log(action: string, user: AuthUserContext, id: string, context: RequestContext, metadata?: unknown) {
    return this.audit.log({ action, userId: user.id, resource: 'ReplyTemplate', resourceId: id, ip: context.ip, userAgent: context.userAgent, metadata });
  }
}
