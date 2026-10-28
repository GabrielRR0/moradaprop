import { describeCase } from '../../../../test/support/describe-case';
import { AppConfig } from '../../../config';
import { loadEnv } from '../../../config/env';
import { CacheService } from '../cache.service';

/** Cache en memoria con el TTL indicado (0 = desactivada). */
function newCache(ttlSeconds: number) {
  const config = new AppConfig(loadEnv());
  Object.assign(config.cache, { driver: 'memory', ttlSeconds });
  return new CacheService(config);
}

/** Cuenta cuantas veces se ejecuta la consulta "costosa". */
function counter() {
  const state = { calls: 0 };
  const compute = async () => {
    state.calls++;
    await new Promise((resolve) => setTimeout(resolve, 20));
    return { n: state.calls };
  };
  return { state, compute };
}

describe('CacheService', () => {
  describeCase('support/cache', {
    que: 'guarda el resultado: la segunda peticion no vuelve a consultar',
    espera: '2 peticiones seguidas = 1 consulta, mismo resultado',
    ejecutar: async () => {
      const cache = newCache(10);
      const { state, compute } = counter();
      const a = await cache.remember('k', compute);
      const b = await cache.remember('k', compute);
      return { a, b, consultas: state.calls };
    },
    verificar: ({ a, b, consultas }) => {
      expect(consultas).toBe(1);
      expect(b).toEqual(a);
    },
    describirObtenido: ({ consultas }) => `${consultas} consulta a la base para 2 peticiones`,
  });

  describeCase('support/cache', {
    que: 'un solo vuelo: 1.000 peticiones simultaneas identicas hacen UNA sola consulta',
    espera: '1.000 peticiones a la vez = 1 consulta y todas reciben lo mismo',
    ejecutar: async () => {
      const cache = newCache(10);
      const { state, compute } = counter();
      const respuestas = await Promise.all(Array.from({ length: 1000 }, () => cache.remember('mapa', compute)));
      return { consultas: state.calls, distintas: new Set(respuestas.map((r) => r.n)).size };
    },
    verificar: ({ consultas, distintas }) => {
      expect(consultas).toBe(1);
      expect(distintas).toBe(1);
    },
    describirObtenido: ({ consultas, distintas }) => `1.000 peticiones simultaneas -> ${consultas} consulta, ${distintas} resultado distinto`,
  });

  describeCase('support/cache', {
    que: 'claves distintas no se mezclan',
    espera: '2 claves = 2 consultas',
    ejecutar: async () => {
      const cache = newCache(10);
      const { state, compute } = counter();
      await Promise.all([cache.remember('zulia', compute), cache.remember('aragua', compute)]);
      return state.calls;
    },
    verificar: (consultas) => expect(consultas).toBe(2),
  });

  describeCase('support/cache', {
    que: 'con TTL 0 la cache esta apagada: cada peticion consulta',
    espera: '3 peticiones = 3 consultas',
    ejecutar: async () => {
      const cache = newCache(0);
      const { state, compute } = counter();
      await cache.remember('k', compute);
      await cache.remember('k', compute);
      await cache.remember('k', compute);
      return state.calls;
    },
    verificar: (consultas) => expect(consultas).toBe(3),
  });

  describeCase('support/cache', {
    que: 'forget(prefijo) borra lo guardado y obliga a consultar de nuevo',
    espera: 'tras borrar, la siguiente peticion consulta; las claves con otro prefijo se conservan',
    ejecutar: async () => {
      const cache = newCache(10);
      const { state, compute } = counter();
      await cache.remember('properties:map:a', compute);
      await cache.remember('otra:clave', compute);
      await cache.forget('properties:');
      await cache.remember('properties:map:a', compute);
      await cache.remember('otra:clave', compute);
      return state.calls;
    },
    verificar: (consultas) => expect(consultas).toBe(3), // 2 iniciales + 1 repetida (la otra clave sigue guardada)
  });

  describeCase('support/cache', {
    que: 'si la consulta falla, el error llega a todos y no se guarda (el siguiente intento reintenta)',
    espera: 'primer intento falla; segundo funciona',
    ejecutar: async () => {
      const cache = newCache(10);
      const falla = () => Promise.reject(new Error('base caida'));
      const primero = await cache.remember('k', falla).catch((e: Error) => e.message);
      const segundo = await cache.remember('k', async () => 'ok');
      return { primero, segundo };
    },
    verificar: ({ primero, segundo }) => {
      expect(primero).toBe('base caida');
      expect(segundo).toBe('ok');
    },
  });
});
