/** Datos con los que se rellena un texto reutilizable al usarlo en una conversación. */
export interface FillData {
  /** Nombre del interesado (se usa solo el primero). */
  name?: string;
  /** Título de la propiedad de la conversación. */
  property?: string;
}

/** Variables que se pueden escribir en un texto; la pantalla las ofrece como botones. */
export const VARIABLES = [
  { token: '{nombre}', label: 'Nombre del interesado' },
  { token: '{propiedad}', label: 'Nombre de la propiedad' },
] as const;

/**
 * Cambia `{nombre}` y `{propiedad}` por los datos de la conversación. Si falta el dato, la variable desaparece
 * junto con el espacio que la precedía ("Hola {nombre}," queda "Hola,") para no dejar huecos raros.
 */
export function fillTemplate(body: string, data: FillData): string {
  const first = data.name?.trim().split(/\s+/)[0] ?? '';
  const property = data.property?.trim() ?? '';
  return body
    .replace(/(\s?)\{nombre\}/gi, (_all, space: string) => (first ? `${space}${first}` : ''))
    .replace(/(\s?)\{propiedad\}/gi, (_all, space: string) => (property ? `${space}${property}` : ''))
    .trim();
}
