import { Injectable } from '@nestjs/common';
import ExcelJS from 'exceljs';
import { COLUMNS } from '../utils/row-mapper';

/** Genera la plantilla descargable con las columnas correctas y una fila de ejemplo. */
@Injectable()
export class ImportTemplateService {
  async xlsx(): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Propiedades');
    sheet.addRow(COLUMNS.map((c) => c.header));
    sheet.addRow(COLUMNS.map((c) => (c.kind === 'number' ? Number(c.example) : c.example)));
    sheet.getRow(1).font = { bold: true };
    sheet.columns.forEach((column, i) => (column.width = Math.max(COLUMNS[i].header.length + 4, 14)));

    const help = workbook.addWorksheet('Instrucciones');
    help.addRows([
      ['Como llenar la planilla'],
      ['Columnas obligatorias', COLUMNS.filter((c) => c.required).map((c) => c.header).join(', ')],
      ['tipo', 'apartamento, casa, townhouse, habitacion, local, oficina, galpon, terreno'],
      ['moneda', 'USD o VES (por defecto USD)'],
      ['si/no', 'amueblado, mascotas, planta_electrica, tanque_agua, fibra_optica, vigilancia'],
      ['latitud / longitud', 'Coordenadas dentro de Venezuela, en decimales (ej. 10.4969 y -66.8477)'],
      ['Limites', 'Hasta 500 filas y 5 MB por archivo. No uses formulas: pega solo valores.'],
    ]);
    help.getColumn(1).width = 24;
    help.getColumn(2).width = 90;

    return Buffer.from(await workbook.xlsx.writeBuffer());
  }

  csv(): Buffer {
    const quote = (value: string) => (/[",;\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value);
    const lines = [COLUMNS.map((c) => c.header), COLUMNS.map((c) => c.example)].map((row) => row.map(quote).join(','));
    return Buffer.from(`\uFEFF${lines.join('\r\n')}\r\n`, 'utf8');
  }
}
