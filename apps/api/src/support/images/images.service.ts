import { BadRequestException, Injectable } from '@nestjs/common';
import sharp from 'sharp';
import { detectImage } from '../../common/files';

export interface ProcessedImage {
  /** JPEG re-codificado y sin metadatos: se guarda en el bucket PRIVADO. */
  original: Buffer;
  /** 300x200 recortado: listados y pines del mapa. */
  thumb: Buffer;
  /** hasta 800x600: tarjetas y ficha. */
  medium: Buffer;
  /** hasta 1920x1440: galeria a pantalla completa. */
  hd: Buffer;
}

export const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const MAX_INPUT_PIXELS = 40_000_000;
const MIN_SIDE = 200;

/**
 * Equivalente a lo que haria Cloudinary, con sharp.
 * Todo archivo se DECODIFICA y se vuelve a CODIFICAR: eso destruye payloads incrustados,
 * archivos poliglota y metadatos (EXIF/GPS) de la foto original.
 */
@Injectable()
export class ImagesService {
  async process(input: Buffer): Promise<ProcessedImage> {
    if (input.length > MAX_IMAGE_BYTES) {
      throw new BadRequestException('La imagen supera el maximo de 10 MB');
    }
    if (!detectImage(input)) {
      throw new BadRequestException('Formato no permitido: solo JPG, PNG o WebP');
    }

    try {
      // rotate() aplica la orientacion EXIF y por defecto sharp elimina todos los metadatos al guardar.
      const base = sharp(input, { limitInputPixels: MAX_INPUT_PIXELS, failOn: 'error' }).rotate();
      const { width = 0, height = 0 } = await base.metadata();
      if (Math.min(width, height) < MIN_SIDE) {
        throw new BadRequestException(`La imagen es muy pequena (minimo ${MIN_SIDE}px por lado)`);
      }

      const [original, thumb, medium, hd] = await Promise.all([
        base.clone().resize(4000, 4000, { fit: 'inside', withoutEnlargement: true }).jpeg({ quality: 90 }).toBuffer(),
        base.clone().resize(300, 200, { fit: 'cover', position: 'attention' }).webp({ quality: 70 }).toBuffer(),
        base.clone().resize(800, 600, { fit: 'inside', withoutEnlargement: true }).webp({ quality: 78 }).toBuffer(),
        base.clone().resize(1920, 1440, { fit: 'inside', withoutEnlargement: true }).webp({ quality: 82 }).toBuffer(),
      ]);
      return { original, thumb, medium, hd };
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      throw new BadRequestException('La imagen esta danada o no es valida');
    }
  }
}
