import { describeCase } from '../../../../../test/support/describe-case';
import { RISK_POLICY } from '../policy';
import { scoreSignals } from '../score';
import type { RiskContext } from '../types';

const NOW = new Date('2026-10-25T12:00:00Z');
const hoursAgo = (h: number) => new Date(NOW.getTime() - h * 3_600_000);

/** Una cuenta con historial en Venezuela, desde su red de siempre. Cada caso cambia lo que necesita. */
const base = (over: Partial<RiskContext> = {}): RiskContext => ({
  now: NOW,
  country: 'VE',
  network: 'red-casa',
  device: null,
  hasHistory: true,
  knownCountries: new Set(['VE']),
  knownNetworks: new Set(['red-casa']),
  lastLogin: { country: 'VE', at: hoursAgo(30) },
  failedLoginsLastHour: 0,
  ...over,
});
const confirmed = { id: 'd1', confirmed: true };
const seen = { id: 'd2', confirmed: false };

const evaluar = (ctx: RiskContext) => {
  const { score, level, reasons } = scoreSignals(ctx);
  return { score, level, motivos: reasons.map((r) => r.signal) };
};

describe('access-risk: tabla de puntos', () => {
  describeCase('access-risk', {
    que: 'su equipo de siempre, desde su pais y su red',
    espera: 'BAJO (-40): entra sin ninguna fricción',
    ejecutar: () => evaluar(base({ device: confirmed })),
    verificar: (r) => expect(r).toMatchObject({ score: -40, level: 'LOW' }),
    describirObtenido: (r) => `${r.level} ${r.score} (${r.motivos.join(', ')})`,
  });

  describeCase('access-risk', {
    que: 'la primera entrada de una cuenta (linea base, sin historial)',
    espera: 'BAJO (0): no hay con que comparar, no se marca nada como nuevo',
    ejecutar: () =>
      evaluar(base({ hasHistory: false, knownCountries: new Set(), knownNetworks: new Set(), lastLogin: null, country: 'CA', network: 'otra' })),
    verificar: (r) => expect(r).toMatchObject({ score: 0, level: 'LOW' }),
  });

  describeCase('access-risk', {
    que: 'usuario con VPN (otro pais, otra red) desde su equipo confirmado',
    espera: 'MEDIO (30 = 50 + 20 - 40): se avisa en la app, sin pedir nada; no cuenta como viaje imposible',
    ejecutar: () => evaluar(base({ country: 'CA', network: 'vpn', device: confirmed, lastLogin: { country: 'VE', at: hoursAgo(1) } })),
    verificar: (r) => {
      expect(r).toMatchObject({ score: 30, level: 'MEDIUM' });
      expect(r.motivos).not.toContain('impossible-travel');
    },
    describirObtenido: (r) => `${r.level} ${r.score} (${r.motivos.join(', ')})`,
  });

  describeCase('access-risk', {
    que: 'atacante con la clave: otro pais, red nueva, sin dispositivo, 2 horas despues del ultimo inicio de sesion',
    espera: 'ALTO (150): pais nuevo + red nueva + dispositivo nuevo + viaje imposible',
    ejecutar: () => evaluar(base({ country: 'CA', network: 'atacante', lastLogin: { country: 'VE', at: hoursAgo(2) } })),
    verificar: (r) => {
      expect(r.level).toBe('HIGH');
      expect(r.score).toBe(150);
      expect(r.motivos).toEqual(['new-country', 'new-network', 'unconfirmed-device', 'impossible-travel']);
    },
    describirObtenido: (r) => `${r.level} ${r.score}`,
  });

  describeCase('access-risk', {
    que: 'equipo nuevo desde su casa (mismo pais y misma red)',
    espera: 'MEDIO (40): aviso, no verificacion',
    ejecutar: () => evaluar(base()),
    verificar: (r) => expect(r).toMatchObject({ score: 40, level: 'MEDIUM', motivos: ['unconfirmed-device'] }),
  });

  describeCase('access-risk', {
    que: 'un dispositivo visto pero NUNCA confirmado (entro solo con la clave) no resta riesgo',
    espera: 'igual que un equipo nuevo: 40',
    ejecutar: () => evaluar(base({ device: seen })),
    verificar: (r) => expect(r.score).toBe(40),
  });

  describeCase('access-risk', {
    que: 'telefono nuevo en otro pais, sin dispositivo confirmado y con el ultimo inicio hace 20 horas',
    espera: 'ALTO (110): sin viaje imposible porque pasaron mas de 6 horas',
    ejecutar: () => evaluar(base({ country: 'CA', network: 'hotel', lastLogin: { country: 'VE', at: hoursAgo(20) } })),
    verificar: (r) => expect(r).toMatchObject({ score: 110, level: 'HIGH' }),
  });

  describeCase('access-risk', {
    que: 'el CDN no dice el pais (null) y la red es nueva en un equipo nuevo',
    espera: 'solo cuentan red y dispositivo (60): ALTO sin inventar un pais',
    ejecutar: () => evaluar(base({ country: null, network: 'nueva' })),
    verificar: (r) => {
      expect(r).toMatchObject({ score: 60, level: 'HIGH' });
      expect(r.motivos).toEqual(['new-network', 'unconfirmed-device']);
    },
  });

  describeCase('access-risk', {
    que: 'fallos de clave recientes en la cuenta',
    espera: '2 fallos no suman; 3 o mas suman 20',
    ejecutar: () => ({
      dos: evaluar(base({ device: confirmed, failedLoginsLastHour: 2 })).score,
      tres: evaluar(base({ device: confirmed, failedLoginsLastHour: RISK_POLICY.failures.threshold })).score,
    }),
    verificar: (r) => expect(r).toEqual({ dos: -40, tres: -20 }),
  });

  describeCase('access-risk', {
    que: 'los umbrales: 29, 30, 59 y 60 puntos',
    espera: 'BAJO, MEDIO, MEDIO, ALTO',
    ejecutar: () => {
      // Se fabrica el puntaje con una senal ficticia para probar solo los cortes.
      const con = (points: number) => scoreSignals(base(), [{ id: 'x', description: '', evaluate: () => ({ points, reason: 'x' }) }]).level;
      return [con(29), con(30), con(59), con(60)];
    },
    verificar: (r) => expect(r).toEqual(['LOW', 'MEDIUM', 'MEDIUM', 'HIGH']),
  });
});
