import { applyDecorators, BadRequestException, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBody, ApiConsumes } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { limitPerMinute, RATE_LIMITS } from '@/common/security/rate-limits';
import { MAX_IMPORT_BYTES } from '../services/intake/import-upload.service';

const SHEET_MIME = [
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/csv',
  'application/csv',
  'application/vnd.ms-excel', // algunos navegadores envian esto para .csv
  'text/plain',
];

/** Subida de UNA planilla (campo "file"): limite de uso, multer en memoria y solo .xlsx o .csv. */
export const UploadImportFile = () =>
  applyDecorators(
    Throttle(limitPerMinute(RATE_LIMITS.import)),
    ApiConsumes('multipart/form-data'),
    ApiBody({ schema: { type: 'object', properties: { file: { type: 'string', format: 'binary' } } } }),
    UseInterceptors(
      FileInterceptor('file', {
        // Memoria: nada toca el disco hasta validar el contenido real del archivo.
        limits: { fileSize: MAX_IMPORT_BYTES, files: 1, fields: 0, parts: 2 },
        fileFilter: (_req, file, cb) =>
          SHEET_MIME.includes(file.mimetype) ? cb(null, true) : cb(new BadRequestException('Sube un archivo .xlsx o .csv'), false),
      }),
    ),
  );
