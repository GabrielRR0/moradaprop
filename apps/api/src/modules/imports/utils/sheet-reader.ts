import { BadRequestException } from '@nestjs/common';
import ExcelJS from 'exceljs';
import { parseCsv } from './csv';

export const MAX_ROWS = 500;
export const MAX_COLUMNS = 30;

type Cell = string | number | boolean | null;

/** Convierte el valor de una celda de Excel a texto/numero simple. Las FORMULAS no se aceptan. */
function toCell(value: ExcelJS.CellValue): Cell {
  if (value === null || value === undefined) return null;
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') return value;
  if (value instanceof Date) return value.toISOString();

  if (typeof value === 'object') {
    if ('formula' in value || 'sharedFormula' in value) {
      throw new BadRequestException('La planilla contiene formulas, que no estan permitidas. Pega solo valores');
    }
    if ('richText' in value) return value.richText.map((part) => part.text).join('');
    if ('text' in value) return String(value.text); // enlaces: se queda el texto, no la URL
    if ('error' in value) return null;
  }
  return null;
}

/**
 * Lee la primera hoja de un .xlsx. Se usa la carga normal (no el streaming de exceljs, que falla de forma
 * intermitente). La memoria esta acotada antes de llegar aqui: 5 MB de archivo y zip-guard (50 MB descomprimido).
 */
async function readXlsx(buffer: Buffer): Promise<Cell[][]> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer as unknown as ExcelJS.Buffer);
  const sheet = workbook.worksheets[0];
  if (!sheet) return [];
  if (sheet.rowCount > MAX_ROWS + 1) {
    throw new BadRequestException(`La planilla supera el maximo de ${MAX_ROWS} filas por importacion`);
  }

  const rows: Cell[][] = [];
  sheet.eachRow({ includeEmpty: false }, (row) => {
    const values = (row.values as ExcelJS.CellValue[]).slice(1, MAX_COLUMNS + 1).map(toCell);
    if (values.some((cell) => cell !== null && String(cell).trim() !== '')) rows.push(values);
  });
  return rows;
}

/** Devuelve las filas de la planilla (la primera es el encabezado). */
export async function readSheet(buffer: Buffer, kind: 'xlsx' | 'csv'): Promise<Cell[][]> {
  try {
    if (kind === 'csv') {
      const rows = parseCsv(buffer.toString('utf8'), MAX_ROWS + 1).map((r) => r.slice(0, MAX_COLUMNS));
      if (rows.length > MAX_ROWS + 1) throw new BadRequestException(`El archivo supera el maximo de ${MAX_ROWS} filas por importacion`);
      return rows;
    }
    return await readXlsx(buffer);
  } catch (error) {
    if (error instanceof BadRequestException) throw error;
    throw new BadRequestException('No se pudo leer el archivo. Verifica que sea una planilla valida');
  }
}
