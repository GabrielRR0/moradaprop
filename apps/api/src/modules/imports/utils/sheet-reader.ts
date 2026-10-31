import { BadRequestException } from '@nestjs/common';
import { SpreadsheetSupport } from '@/support/spreadsheet';
import { parseCsv } from './csv';

export const MAX_ROWS = 500;
export const MAX_COLUMNS = 30;

type Cell = SpreadsheetSupport.SheetCell;

/**
 * Lee la primera hoja de un .xlsx. La memoria esta acotada antes de llegar aqui: 5 MB de archivo y zip-guard
 * (50 MB descomprimido). Las FORMULAS no se aceptan.
 */
async function readXlsx(buffer: Buffer): Promise<Cell[][]> {
  try {
    return await SpreadsheetSupport.readXlsxRows(buffer, { maxRows: MAX_ROWS, maxColumns: MAX_COLUMNS });
  } catch (error) {
    if (error instanceof SpreadsheetSupport.FormulaError) {
      throw new BadRequestException('La planilla contiene formulas, que no estan permitidas. Pega solo valores');
    }
    if (error instanceof SpreadsheetSupport.TooLargeError) {
      throw new BadRequestException(`La planilla supera el maximo de ${MAX_ROWS} filas por importacion`);
    }
    throw error;
  }
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
