/** Un texto reutilizable, ya descifrado, como lo ve quien lo consulta. */
export interface ReplyTemplateResource {
  id: string;
  title: string;
  body: string;
  /** true = lo ve todo el equipo de la inmobiliaria; false = es privado de su autor. */
  shared: boolean;
  /** Nombre de quien lo escribió. */
  author: string;
  /** Lo escribió quien consulta (y no un compañero del equipo). */
  mine: boolean;
  /** Quien consulta lo puede editar o borrar (su autor o el administrador de la inmobiliaria). */
  canEdit: boolean;
  updatedAt: Date;
}

/** Los textos que ve quien consulta: los suyos y los compartidos por su equipo. */
export interface ReplyTemplateListResource {
  items: ReplyTemplateResource[];
  /** Pertenece a una inmobiliaria, así que puede compartir textos con su equipo. */
  canShare: boolean;
}
