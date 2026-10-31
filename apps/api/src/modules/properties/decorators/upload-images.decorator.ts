import { applyDecorators, BadRequestException, UseInterceptors } from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ApiBody, ApiConsumes } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { limitPerMinute, RATE_LIMITS } from '@/common/security/rate-limits';
import { ImagesSupport } from '@/support/images';

const IMAGE_MIME = ['image/jpeg', 'image/png', 'image/webp'];

/** Subida de hasta 10 imagenes (campo "files"): limite de uso, multer en memoria y solo JPG, PNG o WebP. */
export const UploadImages = () =>
  applyDecorators(
    Throttle(limitPerMinute(RATE_LIMITS.upload)),
    ApiConsumes('multipart/form-data'),
    ApiBody({
      schema: { type: 'object', properties: { files: { type: 'array', items: { type: 'string', format: 'binary' } } } },
    }),
    UseInterceptors(
      FilesInterceptor('files', 10, {
        // Sin "storage": multer usa memoria, nada se escribe en disco antes de validar.
        limits: { fileSize: ImagesSupport.MAX_BYTES, files: 10, fields: 0, parts: 12 },
        fileFilter: (_req, file, cb) =>
          IMAGE_MIME.includes(file.mimetype)
            ? cb(null, true)
            : cb(new BadRequestException('Solo se permiten imagenes JPG, PNG o WebP'), false),
      }),
    ),
  );
