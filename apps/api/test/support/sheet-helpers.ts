import ExcelJS from 'exceljs';

/** Fila valida de la planilla (encabezados en español, como la plantilla oficial). */
export const HEADERS = [
  'titulo', 'descripcion', 'tipo', 'precio', 'moneda', 'habitaciones', 'banos', 'estacionamientos', 'area_m2',
  'amueblado', 'mascotas', 'estado', 'municipio', 'urbanizacion', 'direccion', 'latitud', 'longitud',
  'planta_electrica', 'tanque_agua', 'fibra_optica', 'vigilancia',
];

export const fila = (overrides: Record<string, unknown> = {}) => {
  const base: Record<string, unknown> = {
    titulo: 'Apartamento importado', descripcion: 'Apartamento importado desde planilla con descripcion suficiente.',
    tipo: 'apartamento', precio: 400, moneda: 'USD', habitaciones: 2, banos: 1, estacionamientos: 1, area_m2: 80,
    amueblado: 'no', mascotas: 'si', estado: 'Miranda', municipio: 'Chacao', urbanizacion: 'Altamira', direccion: '',
    latitud: 10.5, longitud: -66.85, planta_electrica: 'si', tanque_agua: 'si', fibra_optica: 'no', vigilancia: 'si',
  };
  return HEADERS.map((h) => (h in overrides ? overrides[h] : base[h]));
};

/** Construye un .xlsx real en memoria. Una celda puede ser { formula } para probar el rechazo de formulas. */
export async function xlsxBuffer(rows: unknown[][], headers: string[] = HEADERS): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Propiedades');
  sheet.addRow(headers);
  for (const row of rows) sheet.addRow(row as ExcelJS.CellValue[]);
  return Buffer.from(await workbook.xlsx.writeBuffer());
}

export const csvBuffer = (rows: unknown[][], headers: string[] = HEADERS, delimiter = ',') =>
  Buffer.from([headers, ...rows].map((r) => r.map((c) => String(c ?? '')).join(delimiter)).join('\r\n'), 'utf8');

export const XLSX_MIME = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
