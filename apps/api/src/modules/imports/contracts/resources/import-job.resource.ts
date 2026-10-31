import type { DbSupport } from '@/support/db';

/** Un error de la planilla: en que fila y por que. */
export interface ImportRowErrorResource {
  row: number;
  errors: string[];
}

/** Resumen de una importacion (lo que muestra el historial). */
export interface ImportJobSummaryResource {
  id: string;
  status: DbSupport.ImportStatus;
  totalRows: number;
  importedRows: number;
  failedRows: number;
  createdAt: Date;
  /** Fecha en que termino de procesarse; null mientras sigue en curso. */
  finishedAt: Date | null;
}

/** Una importacion con sus errores fila por fila. */
export interface ImportJobResource extends ImportJobSummaryResource {
  errors: ImportRowErrorResource[] | null;
}

/** Pagina del historial de importaciones. */
export interface ImportJobListResource {
  items: ImportJobSummaryResource[];
  total: number;
  page: number;
  limit: number;
}
