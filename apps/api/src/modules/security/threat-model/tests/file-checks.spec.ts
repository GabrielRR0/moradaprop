import { describeCase } from '../../../../../test/support/describe-case';
import { dangerousFilename } from '../file-checks/dangerous-filename';
import { executableContent } from '../file-checks/executable-content';

const pe = Buffer.concat([Buffer.from('MZ'), Buffer.alloc(0x3a), Buffer.from([0x40, 0, 0, 0]), Buffer.from('PE\0\0')]);
const jpeg = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0, 0x10, 0x4a, 0x46]);

describe('file-checks: contenido', () => {
  describeCase('threat-model', {
    que: 'ejecutables y scripts reales por sus primeros bytes',
    espera: 'PE, ELF, shebang y <?php se reconocen; JPEG y CSV no',
    ejecutar: () => ({
      pe: executableContent.inspect({ buffer: pe }),
      elf: executableContent.inspect({ buffer: Buffer.from([0x7f, 0x45, 0x4c, 0x46, 2, 1, 1]) }),
      shebang: executableContent.inspect({ buffer: Buffer.from('#!/bin/sh\nrm -rf /') }),
      php: executableContent.inspect({ buffer: Buffer.from('  <?php system($_GET[1]); ?>') }),
      jpeg: executableContent.inspect({ buffer: jpeg }),
      csv: executableContent.inspect({ buffer: Buffer.from('titulo,precio\nCasa,100') }),
    }),
    verificar: (r) => {
      expect([r.pe, r.elf, r.shebang, r.php].every(Boolean)).toBe(true);
      expect(r.jpeg).toBeNull();
      expect(r.csv).toBeNull();
    },
    describirObtenido: (r) => JSON.stringify(r),
  });

  describeCase('threat-model', {
    que: 'un CSV legitimo cuya primera columna se llama "MZ"',
    espera: 'no es falso positivo: "MZ" solo cuenta si apunta a una cabecera PE real',
    ejecutar: () => executableContent.inspect({ buffer: Buffer.from('MZ,precio\n' + 'x'.repeat(100)) }),
    verificar: (r) => expect(r).toBeNull(),
  });
});

describe('file-checks: nombres', () => {
  describeCase('threat-model', {
    que: 'nombres con doble extension, extension peligrosa o caracteres que disfrazan',
    espera: 'foto.php.jpg, run.EXE y el truco U+202E se rechazan; sala_1.jpg y planilla.v2.xlsx no',
    ejecutar: () =>
      ['foto.php.jpg', 'run.EXE', 'foto‮gpj.exe', 'a/../b.jpg', 'sala_1.jpg', 'planilla.v2.xlsx', undefined].map((filename) =>
        dangerousFilename.inspect({ buffer: Buffer.alloc(0), filename }),
      ),
    verificar: (r) => {
      expect(r.slice(0, 4).every(Boolean)).toBe(true);
      expect(r.slice(4)).toEqual([null, null, null]);
    },
    describirObtenido: (r) => JSON.stringify(r),
  });
});
