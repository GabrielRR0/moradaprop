import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/common/prisma';
import type { AuthUserContext } from '@/common/security/types';
import { ReplyTemplateVault, UserVault } from '@/modules/security';
import type { ReplyTemplateListResource, ReplyTemplateResource } from '../../contracts/resources';
import { templateInclude, toTemplateResource, type TemplateWithAuthor, type Viewer } from '../../utils/reply-template-mapper';
import { ReplyTemplatePolicy } from '../access/reply-template.policy';

/** Tope de textos que se devuelven de una vez (los limites por persona y por inmobiliaria son menores). */
const MAX_LISTED = 300;

/** Lee los textos reutilizables ya descifrados: los propios y los compartidos por el equipo. */
@Injectable()
export class ReplyTemplateCatalogService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly policy: ReplyTemplatePolicy,
    private readonly vault: ReplyTemplateVault,
    private readonly users: UserVault,
  ) {}

  async list(user: AuthUserContext): Promise<ReplyTemplateListResource> {
    const team = await this.policy.membership(user.id);
    const rows = await this.prisma.replyTemplate.findMany({
      where: { OR: [{ ownerUserId: user.id }, ...(team ? [{ agencyId: team.agencyId }] : [])] },
      include: templateInclude,
      orderBy: { updatedAt: 'desc' },
      take: MAX_LISTED,
    });
    const viewer: Viewer = { userId: user.id, team };
    return { items: rows.map((row) => toTemplateResource(this.decode(row), viewer)), canShare: team !== null };
  }

  /** Un texto recien guardado, tal como lo ve quien lo guardó. */
  async one(user: AuthUserContext, id: string): Promise<ReplyTemplateResource> {
    const row = await this.prisma.replyTemplate.findUniqueOrThrow({ where: { id }, include: templateInclude });
    return toTemplateResource(this.decode(row), { userId: user.id, team: await this.policy.membership(user.id) });
  }

  private decode(row: TemplateWithAuthor): TemplateWithAuthor {
    return { ...this.vault.decode(row), owner: this.users.decode(row.owner) };
  }
}
