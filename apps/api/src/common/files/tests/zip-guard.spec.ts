import { describeCase } from '@test/support/describe-case';
import { isSafeZip, summarizeZip } from '../zip-guard';

/** Zip minimo y falso: solo el directorio central, declarando tamanos sin datos reales. */
function fakeZip(entries: Array<{ name: string; uncompressed: number }>): Buffer {
  const central = entries.map(({ name, uncompressed }) => {
    const header = Buffer.alloc(46 + name.length);
    header.writeUInt32LE(0x02014b50, 0);
    header.writeUInt32LE(uncompressed, 24);
    header.writeUInt16LE(name.length, 28);
    header.write(name, 46);
    return header;
  });
  const centralBytes = Buffer.concat(central);
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0);
  eocd.writeUInt16LE(entries.length, 10);
  eocd.writeUInt32LE(centralBytes.length, 12);
  eocd.writeUInt32LE(0, 16); // el directorio central empieza en 0
  return Buffer.concat([centralBytes, eocd]);
}

describe('zip-guard', () => {
  describeCase('common/files', {
    que: 'suma el tamano descomprimido declarado sin descomprimir nada',
    espera: '3 entradas y 3000 bytes',
    ejecutar: () => summarizeZip(fakeZip([{ name: 'a.xml', uncompressed: 1000 }, { name: 'b.xml', uncompressed: 1500 }, { name: 'c.xml', uncompressed: 500 }])),
    verificar: (resumen) => expect(resumen).toEqual({ entries: 3, uncompressedBytes: 3000 }),
  });

  describeCase('common/files', {
    que: 'un zip normal de planilla es seguro; una "zip bomb" (4 GB declarados) no',
    espera: 'true para 2 MB y false para 4 GB',
    ejecutar: () => [
      isSafeZip(fakeZip([{ name: 'xl/sheet1.xml', uncompressed: 2 * 1024 * 1024 }])),
      isSafeZip(fakeZip([{ name: 'xl/sheet1.xml', uncompressed: 4_000_000_000 }])),
    ],
    verificar: (r) => expect(r).toEqual([true, false]),
  });

  describeCase('common/files', {
    que: 'rechaza zips con demasiadas entradas y estructuras corruptas',
    espera: 'false con 500 entradas y false con basura',
    ejecutar: () => [
      isSafeZip(fakeZip(Array.from({ length: 500 }, (_, i) => ({ name: `f${i}`, uncompressed: 10 })))),
      isSafeZip(Buffer.from('esto no es un zip, ni se le parece')),
    ],
    verificar: (r) => expect(r).toEqual([false, false]),
  });
});
