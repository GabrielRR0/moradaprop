/** Textos reutilizables para responder mensajes. Reflejan `/api/reply-templates`. */

export interface ReplyTemplate {
  id: string;
  title: string;
  body: string;
  /** true = lo ve todo el equipo de la inmobiliaria; false = solo su autor. */
  shared: boolean;
  author: string;
  /** Lo escribió quien consulta (y no un compañero). */
  mine: boolean;
  /** Quien consulta lo puede editar o borrar. */
  canEdit: boolean;
  updatedAt: string;
}

export interface ReplyTemplateList {
  items: ReplyTemplate[];
  /** Pertenece a una inmobiliaria, así que puede compartir con su equipo. */
  canShare: boolean;
}

export interface ReplyTemplateInput {
  title: string;
  body: string;
  shared: boolean;
}
