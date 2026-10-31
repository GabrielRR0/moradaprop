import type { DbSupport } from '@/support/db';
import type { ImportJobResource, ImportRowErrorResource } from '../contracts/resources';

type ImportJobRow = Pick<
  DbSupport.ImportJob,
  'id' | 'status' | 'totalRows' | 'importedRows' | 'failedRows' | 'createdAt' | 'finishedAt' | 'errors'
>;

/** Importacion lista para responder: solo lo que ve el usuario, sin la clave del archivo ni ids internos. */
export function toImportJob(job: ImportJobRow): ImportJobResource {
  return {
    id: job.id,
    status: job.status,
    totalRows: job.totalRows,
    importedRows: job.importedRows,
    failedRows: job.failedRows,
    createdAt: job.createdAt,
    finishedAt: job.finishedAt,
    errors: job.errors as ImportRowErrorResource[] | null,
  };
}
