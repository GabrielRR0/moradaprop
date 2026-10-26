import { describeCase } from '../../../../../test/support/describe-case';
import { FILE_CHECKS } from '../file-checks';
import { ThreatLedgerService } from '../services/threat-ledger.service';
import { SHIELDS } from '../shields';
import { STRIDE_NAMES } from '../types';

describe('lista de escudos y revisiones', () => {
  describeCase('threat-model', {
    que: 'el modelo cubre las 6 letras de STRIDE y los ids no se repiten',
    espera: 'S, T, R, I, D y E tienen al menos un escudo; ids unicos',
    ejecutar: () => ({
      letras: [...new Set(SHIELDS.map((s) => s.stride))].sort().join(''),
      repetidos: SHIELDS.length - new Set(SHIELDS.map((s) => s.id)).size,
      revisiones: FILE_CHECKS.map((c) => c.id),
    }),
    verificar: ({ letras, repetidos, revisiones }) => {
      expect(letras).toBe(Object.keys(STRIDE_NAMES).sort().join(''));
      expect(repetidos).toBe(0);
      expect(new Set(revisiones).size).toBe(revisiones.length);
    },
    describirObtenido: ({ letras, revisiones }) => `letras ${letras}; revisiones ${revisiones.join(', ')}`,
  });

  describeCase('threat-model', {
    que: 'cada escudo que cuenta respuestas',
    espera: 'solo reconoce su codigo de estado y ninguno reconoce un 200',
    ejecutar: () =>
      SHIELDS.filter((s) => s.matches).map((s) => ({
        id: s.id,
        acepta200: s.matches!({ status: 200, method: 'GET', path: '/api/x' }),
      })),
    verificar: (r) => expect(r.every((s) => !s.acepta200)).toBe(true),
  });
});

describe('ThreatLedgerService', () => {
  describeCase('threat-model', {
    que: 'ventana deslizante de 60 s: 3 hechos dentro y 1 que cae fuera de la ventana',
    espera: 'cuenta 1, 2, 3 y luego, pasados 61 s, vuelve a 1',
    ejecutar: () => {
      const ledger = new ThreatLedgerService();
      const t0 = 1_000_000;
      return [ledger.hit('k', 60, t0), ledger.hit('k', 60, t0 + 1000), ledger.hit('k', 60, t0 + 2000), ledger.hit('k', 60, t0 + 63_000)];
    },
    verificar: (r) => expect(r).toEqual([1, 2, 3, 1]),
  });

  describeCase('threat-model', {
    que: 'sujetos distintos y clear()',
    espera: 'cada clave cuenta aparte y clear la reinicia',
    ejecutar: () => {
      const ledger = new ThreatLedgerService();
      ledger.hit('a', 60);
      ledger.hit('a', 60);
      const b = ledger.hit('b', 60);
      ledger.clear('a');
      return { b, a: ledger.hit('a', 60) };
    },
    verificar: (r) => expect(r).toEqual({ b: 1, a: 1 }),
  });
});
