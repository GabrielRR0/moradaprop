import sharp from 'sharp';

export interface RenderOptions {
  format: 'jpeg' | 'webp';
  quality?: number;
  /** Si falta, no se redimensiona. */
  size?: { width: number; height: number; fit?: 'cover' };
}

/** Convierte una imagen (o SVG) a jpeg/webp, opcionalmente redimensionada. Para el seed y los tests. */
export function render(input: Buffer | string, { format, quality, size }: RenderOptions): Promise<Buffer> {
  let image = sharp(input);
  if (size) image = image.resize(size.width, size.height, size.fit ? { fit: size.fit } : undefined);
  return (format === 'jpeg' ? image.jpeg({ quality }) : image.webp({ quality })).toBuffer();
}

/** JPEG de un solo color, valido para subir como foto. Para los tests. */
export const solidJpeg = (width: number, height: number, rgb: { r: number; g: number; b: number }): Promise<Buffer> =>
  sharp({ create: { width, height, channels: 3, background: rgb } }).jpeg().toBuffer();
