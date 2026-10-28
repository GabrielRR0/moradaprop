import ExcelJS from 'exceljs';

export type SheetCell = string | number | boolean | null;
/** Valor que se puede escribir en una celda. `{ formula }` sirve para probar el rechazo de formulas. */
export type SheetValue = SheetCell | Date | { formula: string };

export class FormulaError extends Error {}
export class TooLargeError extends Error {}

export interface SheetSpec {
  name: string;
  rows: SheetValue[][];
  /** Pone en negrita la primera fila. */
  boldHeader?: boolean;
  /** Ancho por columna (A, B, ...). */
  columnWidths?: number[];
}

function toCell(value: ExcelJS.CellValue): SheetCell {
  if (value === null || value === undefined) return null;
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') return value;
  if (value instanceof Date) return value.toISOString();

  if (typeof value === 'object') {
    if ('formula' in value || 'sharedFormula' in value) throw new FormulaError('formulas no permitidas');
    if ('richText' in value) return value.richText.map((part) => part.text).join('');
    if ('text' in value) return String(value.text); // enlaces: se queda el texto, no la URL
    if ('error' in value) return null;
  }
  return null;
}

/**
 * Filas con datos de la primera hoja de un .xlsx (la primera fila es el encabezado). Carga normal, no streaming
 * (el streaming de exceljs falla de forma intermitente): acota el tamano antes de llamar.
 * Lanza `FormulaError` si hay formulas y `TooLargeError` si hay mas de `maxRows` filas de datos.
 */
export async function readXlsxRows(buffer: Buffer, limits: { maxRows: number; maxColumns: number }): Promise<SheetCell[][]> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer as unknown as ExcelJS.Buffer);
  const sheet = workbook.worksheets[0];
  if (!sheet) return [];
  if (sheet.rowCount > limits.maxRows + 1) throw new TooLargeError(`mas de ${limits.maxRows} filas`);

  const rows: SheetCell[][] = [];
  sheet.eachRow({ includeEmpty: false }, (row) => {
    const values = (row.values as ExcelJS.CellValue[]).slice(1, limits.maxColumns + 1).map(toCell);
    if (values.some((cell) => cell !== null && String(cell).trim() !== '')) rows.push(values);
  });
  return rows;
}

/** Arma un .xlsx en memoria con una o mas hojas. */
export async function buildXlsx(sheets: SheetSpec[]): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  for (const spec of sheets) {
    const sheet = workbook.addWorksheet(spec.name);
    sheet.addRows(spec.rows as ExcelJS.CellValue[][]);
    if (spec.boldHeader) sheet.getRow(1).font = { bold: true };
    spec.columnWidths?.forEach((width, i) => (sheet.getColumn(i + 1).width = width));
  }
  return Buffer.from(await workbook.xlsx.writeBuffer());
}
