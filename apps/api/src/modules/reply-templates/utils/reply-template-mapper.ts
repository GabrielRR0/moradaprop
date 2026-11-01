import { DbSupport } from '@/support/db';
import type { ReplyTemplateResource } from '../contracts/resources';

/** Los textos se leen siempre con el nombre de su autor. */
export const templateInclude = { owner: { select: { name: true } } } satisfies DbSupport.Prisma.ReplyTemplateInclude;

export type TemplateWithAuthor = DbSupport.Prisma.ReplyTemplateGetPayload<{ include: typeof templateInclude }>;

/** Inmobiliaria a la que pertenece el usuario y si la administra. */
export interface TeamMembership {
  agencyId: string;
  admin: boolean;
}

/** Quien consulta, para decidir qué puede editar. */
export interface Viewer {
  userId: string;
  team: TeamMembership | null;
}

/** Un texto ya descifrado (y su autor también) listo para responder. */
export const toTemplateResource = (row: TemplateWithAuthor, viewer: Viewer): ReplyTemplateResource => ({
  id: row.id,
  title: row.title,
  body: row.body,
  shared: row.agencyId !== null,
  author: row.owner.name,
  mine: row.ownerUserId === viewer.userId,
  canEdit: row.ownerUserId === viewer.userId || (row.agencyId !== null && viewer.team?.agencyId === row.agencyId && viewer.team.admin),
  updatedAt: row.updatedAt,
});
