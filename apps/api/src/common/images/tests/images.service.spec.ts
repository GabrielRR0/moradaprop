import sharp from 'sharp';
import { describeCase } from '../../../../test/support/describe-case';
import { ImagesService } from '../images.service';

const service = new ImagesService();

const foto = (width = 1600, height = 1200) =>
  sharp({ create: { width, height, channels: 3, background: { r: 200, g: 80, b: 40 } } });

const rechazo = async (buffer: Buffer) => {
  try {
    await service.process(buffer);
    return 'no fallo';
  } catch (error) {
    return (error as Error).message;
  }
};

describe('ImagesService', () => {
  describeCase('common/images', {
    que: 'genera original y las 3 variantes a los tamanos del plan',
    espera: 'thumb 300x200 webp, medium <=800x600 webp, hd <=1920x1440 webp y original jpeg',
    ejecutar: async () => {
      const r = await service.process(await foto().jpeg().toBuffer());
      const meta = async (b: Buffer) => sharp(b).metadata();
      return { thumb: await meta(r.thumb), medium: await meta(r.medium), hd: await meta(r.hd), original: await meta(r.original) };
    },
    verificar: ({ thumb, medium, hd, original }) => {
      expect([thumb.width, thumb.height, thumb.format]).toEqual([300, 200, 'webp']);
      expect([medium.width, medium.height, medium.format]).toEqual([800, 600, 'webp']);
      expect([hd.width, hd.height, hd.format]).toEqual([1600, 1200, 'webp']);
      expect(original.format).toBe('jpeg');
    },
    describirObtenido: ({ thumb, medium, hd, original }) =>
      `thumb ${thumb.width}x${thumb.height}, medium ${medium.width}x${medium.height}, hd ${hd.width}x${hd.height}, original ${original.format}`,
  });

  describeCase('common/images', {
    que: 'no agranda imagenes pequenas (hd y medium conservan su tamano)',
    espera: 'una foto de 500x400 queda en 500x400 en medium y hd',
    ejecutar: async () => {
      const r = await service.process(await foto(500, 400).png().toBuffer());
      return [(await sharp(r.medium).metadata()).width, (await sharp(r.hd).metadata()).width];
    },
    verificar: (anchos) => expect(anchos).toEqual([500, 500]),
  });

  describeCase('common/images', {
    que: 'elimina los metadatos EXIF (por ejemplo la ubicacion GPS) de la foto',
    espera: 'la entrada tiene EXIF y ninguna variante de salida lo tiene',
    ejecutar: async () => {
      const conExif = await foto().jpeg().withExif({ IFD0: { ImageDescription: 'ubicacion-secreta' } }).toBuffer();
      const r = await service.process(conExif);
      return {
        entrada: Boolean((await sharp(conExif).metadata()).exif),
        salidas: await Promise.all([r.original, r.thumb, r.medium, r.hd].map(async (b) => Boolean((await sharp(b).metadata()).exif))),
      };
    },
    verificar: ({ entrada, salidas }) => {
      expect(entrada).toBe(true);
      expect(salidas).toEqual([false, false, false, false]);
    },
    describirObtenido: ({ entrada, salidas }) => `entrada con EXIF: ${entrada}; salidas con EXIF: ${salidas.join(',')}`,
  });

  describeCase('common/images', {
    que: 'rechaza un archivo que no es imagen aunque se llame .jpg',
    espera: 'mensaje "Formato no permitido"',
    ejecutar: () => rechazo(Buffer.from('<?php system($_GET["c"]); ?>')),
    verificar: (mensaje) => expect(mensaje).toContain('Formato no permitido'),
  });

  describeCase('common/images', {
    que: 'rechaza un poliglota: cabecera JPEG valida con codigo malicioso en el cuerpo',
    espera: 'mensaje "danada o no es valida"',
    ejecutar: () => rechazo(Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xe0]), Buffer.from('<script>alert(1)</script>')])),
    verificar: (mensaje) => expect(mensaje).toContain('danada'),
  });

  describeCase('common/images', {
    que: 'rechaza imagenes demasiado pequenas y archivos de mas de 10 MB',
    espera: 'mensajes de "muy pequena" y "supera el maximo"',
    ejecutar: async () => [await rechazo(await foto(100, 100).png().toBuffer()), await rechazo(Buffer.alloc(10 * 1024 * 1024 + 1))],
    verificar: ([pequena, grande]) => {
      expect(pequena).toContain('muy pequena');
      expect(grande).toContain('supera el maximo');
    },
  });
});
