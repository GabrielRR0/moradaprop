import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreatePropertyDto } from '../../properties';

type Cell = string | number | boolean | null;
type FieldKind = 'text' | 'number' | 'boolean' | 'type' | 'currency';

interface Column {
  key: keyof CreatePropertyDto;
  header: string;
  kind: FieldKind;
  required: boolean;
  aliases?: string[];
  example: string;
}

/** Columnas de la planilla, en español. Tambien generan la plantilla descargable. */
export const COLUMNS: Column[] = [
  { key: 'title', header: 'titulo', kind: 'text', required: true, aliases: ['nombre', 'title'], example: 'Apartamento en Los Palos Grandes' },
  { key: 'description', header: 'descripcion', kind: 'text', required: true, aliases: ['description'], example: 'Apartamento de 3 habitaciones, cerca del metro y comercios.' },
  { key: 'type', header: 'tipo', kind: 'type', required: true, example: 'apartamento' },
  { key: 'priceAmount', header: 'precio', kind: 'number', required: true, example: '450' },
  { key: 'currency', header: 'moneda', kind: 'currency', required: false, example: 'USD' },
  { key: 'bedrooms', header: 'habitaciones', kind: 'number', required: false, example: '3' },
  { key: 'bathrooms', header: 'banos', kind: 'number', required: false, example: '2' },
  { key: 'parkingSpots', header: 'estacionamientos', kind: 'number', required: false, example: '1' },
  { key: 'areaM2', header: 'area_m2', kind: 'number', required: false, example: '110' },
  { key: 'furnished', header: 'amueblado', kind: 'boolean', required: false, example: 'no' },
  { key: 'petsAllowed', header: 'mascotas', kind: 'boolean', required: false, example: 'si' },
  { key: 'state', header: 'estado', kind: 'text', required: true, example: 'Miranda' },
  { key: 'municipality', header: 'municipio', kind: 'text', required: true, example: 'Chacao' },
  { key: 'urbanization', header: 'urbanizacion', kind: 'text', required: false, example: 'Los Palos Grandes' },
  { key: 'address', header: 'direccion', kind: 'text', required: false, example: 'Av. Francisco de Miranda' },
  { key: 'latitude', header: 'latitud', kind: 'number', required: true, example: '10.4969' },
  { key: 'longitude', header: 'longitud', kind: 'number', required: true, example: '-66.8477' },
  { key: 'hasGenerator', header: 'planta_electrica', kind: 'boolean', required: false, example: 'si' },
  { key: 'hasWaterTank', header: 'tanque_agua', kind: 'boolean', required: false, example: 'si' },
  { key: 'hasFiberOptic', header: 'fibra_optica', kind: 'boolean', required: false, example: 'no' },
  { key: 'hasSecurity', header: 'vigilancia', kind: 'boolean', required: false, example: 'si' },
];

/** minusculas, sin tildes, espacios -> guion bajo: "Baños " -> "banos". */
export const normalizeHeader = (text: string) =>
  text.normalize('NFD').replace(/[̀-ͯ]/g, '').trim().toLowerCase().replace(/[\s-]+/g, '_');

const TYPE_ALIASES: Record<string, string> = {
  APARTAMENTO: 'APARTAMENTO', APTO: 'APARTAMENTO', APT: 'APARTAMENTO', DEPARTAMENTO: 'APARTAMENTO',
  CASA: 'CASA', TOWNHOUSE: 'TOWNHOUSE', TOWN_HOUSE: 'TOWNHOUSE',
  HABITACION: 'HABITACION', CUARTO: 'HABITACION',
  LOCAL: 'LOCAL', LOCAL_COMERCIAL: 'LOCAL', OFICINA: 'OFICINA', GALPON: 'GALPON', TERRENO: 'TERRENO',
};
const CURRENCY_ALIASES: Record<string, string> = {
  USD: 'USD', $: 'USD', DOLAR: 'USD', DOLARES: 'USD', VES: 'VES', BS: 'VES', BOLIVAR: 'VES', BOLIVARES: 'VES',
};
const TRUE_VALUES = ['si', 's', 'true', '1', 'x', 'yes', 'y'];
const FALSE_VALUES = ['no', 'n', 'false', '0', ''];

/**
 * Neutraliza "inyeccion de formulas": un texto que empieza con = + - @ (o tab/enter) se interpreta
 * como formula si alguien exporta los datos a Excel. Se antepone una comilla para que sea solo texto.
 */
export const neutralizeFormula = (text: string) => (/^[=+\-@\t\r]/.test(text) ? `'${text}` : text);

export interface MappedRow {
  row: number;
  data?: CreatePropertyDto;
  errors: string[];
}

export interface MappedSheet {
  rows: MappedRow[];
  missingHeaders: string[];
  ignoredHeaders: string[];
}

/** Convierte una celda a lo que espera el DTO segun el tipo de columna. */
function convert(column: Column, cell: Cell): { value?: unknown; error?: string } {
  const text = cell === null ? '' : String(cell).trim();
  if (text === '') return {};

  switch (column.kind) {
    case 'text':
      return { value: neutralizeFormula(text) };
    case 'number': {
      if (typeof cell === 'number') return { value: cell };
      // "450,50" (coma decimal) y "1.200,50" (miles con punto)
      const normalized = /,\d{1,2}$/.test(text) ? text.replace(/\./g, '').replace(',', '.') : text.replace(/,/g, '');
      const value = Number(normalized);
      return Number.isFinite(value) ? { value } : { error: `${column.header}: "${text}" no es un numero` };
    }
    case 'boolean': {
      const lower = text.toLowerCase();
      if (TRUE_VALUES.includes(lower)) return { value: true };
      if (FALSE_VALUES.includes(lower)) return { value: false };
      return { error: `${column.header}: usa si/no` };
    }
    case 'type': {
      const key = normalizeHeader(text).toUpperCase();
      return TYPE_ALIASES[key] ? { value: TYPE_ALIASES[key] } : { error: `${column.header}: "${text}" no es un tipo valido` };
    }
    case 'currency': {
      const key = normalizeHeader(text).toUpperCase();
      return CURRENCY_ALIASES[key] ? { value: CURRENCY_ALIASES[key] } : { error: `${column.header}: usa USD o VES` };
    }
  }
}

/** Traduce el mensaje de class-validator (que habla del campo en ingles) a la columna de la planilla. */
const withColumnName = (message: string) =>
  COLUMNS.reduce((text, column) => text.replace(new RegExp(`\\b${column.key}\\b`, 'g'), column.header), message);

/**
 * Valida la planilla FILA POR FILA reutilizando las mismas reglas que la publicacion individual
 * (CreatePropertyDto): una propiedad importada cumple exactamente lo mismo que una creada a mano.
 */
export async function mapSheet(table: Cell[][]): Promise<MappedSheet> {
  const [headerRow = [], ...body] = table;
  const headers = headerRow.map((cell) => normalizeHeader(String(cell ?? '')));

  const indexOf = new Map<string, number>();
  const known = new Map<string, Column>();
  for (const column of COLUMNS) {
    for (const name of [column.header, ...(column.aliases ?? [])]) known.set(normalizeHeader(name), column);
  }
  headers.forEach((header, index) => {
    const column = known.get(header);
    if (column && !indexOf.has(column.header)) indexOf.set(column.header, index);
  });

  const missingHeaders = COLUMNS.filter((c) => c.required && !indexOf.has(c.header)).map((c) => c.header);
  const ignoredHeaders = headerRow.map(String).filter((_, i) => headers[i] && !known.has(headers[i]));
  if (missingHeaders.length > 0) return { rows: [], missingHeaders, ignoredHeaders };

  const rows: MappedRow[] = [];
  for (const [i, cells] of body.entries()) {
    const row = i + 2; // numero de fila en la planilla (1 = encabezado)
    const errors: string[] = [];
    const plain: Record<string, unknown> = {};

    for (const column of COLUMNS) {
      const index = indexOf.get(column.header);
      if (index === undefined) continue;
      const { value, error } = convert(column, cells[index] ?? null);
      if (error) errors.push(error);
      else if (value !== undefined) plain[column.key] = value;
    }

    const dto = plainToInstance(CreatePropertyDto, plain);
    const violations = await validate(dto, { whitelist: true, forbidNonWhitelisted: true });
    for (const violation of violations) {
      for (const message of Object.values(violation.constraints ?? {})) errors.push(withColumnName(message));
    }
    rows.push(errors.length > 0 ? { row, errors } : { row, data: dto, errors });
  }
  return { rows, missingHeaders, ignoredHeaders };
}
