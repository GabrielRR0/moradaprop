import { Injectable } from '@nestjs/common';
import { SpreadsheetSupport } from '../../../support/spreadsheet';
import { COLUMNS } from '../utils/row-mapper';

/** Genera la plantilla descargable con las columnas correctas y una fila de ejemplo. */
@Injectable()
export class ImportTemplateService {
  xlsx(): Promise<Buffer> {
    return SpreadsheetSupport.buildXlsx([
      {
        name: 'Propiedades',
        boldHeader: true,
        columnWidths: COLUMNS.map((c) => Math.max(c.header.length + 4, 14)),
        rows: [
          COLUMNS.map((c) => c.header),
          COLUMNS.map((c) => (c.kind === 'number' ? Number(c.example) : c.example)),
        ],
      },
      {
        name: 'Instrucciones',
        columnWidths: [24, 90],
        rows: [
          ['Como llenar la planilla'],
          ['Columnas obligatorias', COLUMNS.filter((c) => c.required).map((c) => c.header).join(', ')],
          ['tipo', 'apartamento, casa, townhouse, habitacion, local, oficina, galpon, terreno'],
          ['moneda', 'USD o VES (por defecto USD)'],
          ['si/no', 'amueblado, mascotas, planta_electrica, tanque_agua, fibra_optica, vigilancia'],
          ['latitud / longitud', 'Coordenadas dentro de Venezuela, en decimales (ej. 10.4969 y -66.8477)'],
          ['Limites', 'Hasta 500 filas y 5 MB por archivo. No uses formulas: pega solo valores.'],
        ],
      },
    ]);
  }

  csv(): Buffer {
    const quote = (value: string) => (/[",;\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value);
    const lines = [COLUMNS.map((c) => c.header), COLUMNS.map((c) => c.example)].map((row) => row.map(quote).join(','));
    return Buffer.from(`\uFEFF${lines.join('\r\n')}\r\n`, 'utf8');
  }
}
