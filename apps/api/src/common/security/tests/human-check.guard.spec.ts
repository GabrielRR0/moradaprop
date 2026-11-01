import type { ExecutionContext } from '@nestjs/common';
import { describeCase } from '@test/support/describe-case';
import { HumanCheckGuard } from '../guards/human-check.guard';

type Result = 'valid' | 'invalid' | 'unavailable';

/** Una peticion HTTP minima, con las cabeceras que se indiquen. */
const contexto = (headers: Record<string, string | string[]>, ip = '200.1.2.3') =>
  ({ getType: () => 'http', switchToHttp: () => ({ getRequest: () => ({ headers, ip }) }) }) as unknown as ExecutionContext;

const guardia = (enabled: boolean, resultado: Result = 'valid') => {
  const verify = jest.fn().mockResolvedValue(resultado);
  const guard = new HumanCheckGuard({ security: { turnstile: { enabled } } } as never, { verify } as never);
  return { guard, verify };
};

/** Lo que responde el guard: true si deja pasar, o [status, code] si lo niega. */
const resultadoDe = async (guard: HumanCheckGuard, ctx: ExecutionContext) => {
  try {
    return await guard.canActivate(ctx);
  } catch (error) {
    const e = error as { getStatus: () => number; getResponse: () => { code?: string } };
    return [e.getStatus(), e.getResponse().code];
  }
};

describe('HumanCheckGuard: el "no soy un robot" de las rutas sensibles', () => {
  describeCase('human-check', {
    que: 'con TURNSTILE_ENABLED=false no hace nada: deja pasar sin mirar la cabecera ni llamar a Cloudflare',
    espera: 'true y ninguna llamada',
    ejecutar: async () => {
      const { guard, verify } = guardia(false, 'invalid');
      return { paso: await resultadoDe(guard, contexto({})), llamadas: verify.mock.calls.length };
    },
    verificar: (r) => expect(r).toEqual({ paso: true, llamadas: 0 }),
  });

  describeCase('human-check', {
    que: 'encendido, sin la cabecera x-turnstile-token niega con HUMAN_CHECK_REQUIRED (y no llama a Cloudflare)',
    espera: '[403, HUMAN_CHECK_REQUIRED] y ninguna llamada',
    ejecutar: async () => {
      const { guard, verify } = guardia(true);
      return { r: await resultadoDe(guard, contexto({})), llamadas: verify.mock.calls.length };
    },
    verificar: ({ r, llamadas }) => {
      expect(r).toEqual([403, 'HUMAN_CHECK_REQUIRED']);
      expect(llamadas).toBe(0);
    },
  });

  describeCase('human-check', {
    que: 'encendido, valida el token con Cloudflare junto con la IP del cliente',
    espera: 'true; verify recibe el token y la IP',
    ejecutar: async () => {
      const { guard, verify } = guardia(true, 'valid');
      return { r: await resultadoDe(guard, contexto({ 'x-turnstile-token': 'token-1' }, '190.9.9.9')), llamada: verify.mock.calls[0] };
    },
    verificar: ({ r, llamada }) => {
      expect(r).toBe(true);
      expect(llamada).toEqual(['token-1', '190.9.9.9']);
    },
  });

  describeCase('human-check', {
    que: 'un token que Cloudflare rechaza se niega con HUMAN_CHECK_FAILED; si Cloudflare no responde, con 503 HUMAN_CHECK_UNAVAILABLE (falla cerrado)',
    espera: '[403, HUMAN_CHECK_FAILED] y [503, HUMAN_CHECK_UNAVAILABLE]',
    ejecutar: async () => ({
      invalido: await resultadoDe(guardia(true, 'invalid').guard, contexto({ 'x-turnstile-token': 't' })),
      caido: await resultadoDe(guardia(true, 'unavailable').guard, contexto({ 'x-turnstile-token': 't' })),
    }),
    verificar: (r) => expect(r).toEqual({ invalido: [403, 'HUMAN_CHECK_FAILED'], caido: [503, 'HUMAN_CHECK_UNAVAILABLE'] }),
  });

  describeCase('human-check', {
    que: 'si la cabecera llega repetida se usa la primera; un contexto que no es HTTP se niega',
    espera: 'true con la primera; acceso denegado (403) sin peticion',
    ejecutar: async () => {
      const { guard, verify } = guardia(true, 'valid');
      const repetida = await resultadoDe(guard, contexto({ 'x-turnstile-token': ['primero', 'segundo'] }));
      const sinHttp = await resultadoDe(guardia(true).guard, { getType: () => 'rpc' } as unknown as ExecutionContext);
      return { repetida, usado: verify.mock.calls[0][0], sinHttp };
    },
    verificar: (r) => expect(r).toEqual({ repetida: true, usado: 'primero', sinHttp: [403, undefined] }),
  });
});
