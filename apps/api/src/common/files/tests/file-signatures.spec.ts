import { describeCase } from '@test/support/describe-case';
import { detectImage, detectSpreadsheet } from '../file-signatures';

const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0]);
const jpeg = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0, 0]);
const webp = Buffer.concat([Buffer.from('RIFF'), Buffer.from([1, 0, 0, 0]), Buffer.from('WEBPVP8 ')]);
const zip = Buffer.from([0x50, 0x4b, 0x03, 0x04, 0, 0, 0, 0]);

describe('file-signatures', () => {
  describeCase('common/files', {
    que: 'reconoce JPEG, PNG y WebP por sus primeros bytes, no por el nombre',
    espera: 'jpeg, png, webp; un texto y un archivo vacio dan null',
    ejecutar: () => [detectImage(jpeg), detectImage(png), detectImage(webp), detectImage(Buffer.from('hola')), detectImage(Buffer.alloc(0))],
    verificar: (r) => expect(r).toEqual(['jpeg', 'png', 'webp', null, null]),
  });

  describeCase('common/files', {
    que: 'reconoce un .xlsx (zip) y un CSV de texto',
    espera: 'xlsx y csv',
    ejecutar: () => [detectSpreadsheet(zip), detectSpreadsheet(Buffer.from('titulo,precio\nCasa,100'))],
    verificar: (r) => expect(r).toEqual(['xlsx', 'csv']),
  });

  describeCase('common/files', {
    que: 'rechaza un Excel con macros (vbaProject.bin) y binarios disfrazados de CSV',
    espera: 'null en ambos',
    ejecutar: () => [
      detectSpreadsheet(Buffer.concat([zip, Buffer.from('xl/vbaProject.bin')])),
      detectSpreadsheet(Buffer.from([0x00, 0x01, 0x02, 0x2c, 0x03])),
    ],
    verificar: (r) => expect(r).toEqual([null, null]),
  });
});
