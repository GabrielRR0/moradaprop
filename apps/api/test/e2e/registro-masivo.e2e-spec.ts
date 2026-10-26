import { auditLogFirst } from '../support/auth-helpers';
import { describeCase } from '../support/describe-case';
import { overrideEnv } from '../support/env-helpers';
import { createTestApp, PASSWORD, type TestApp } from '../support/test-app';

/** Espera (hasta 3 s) a que se cumpla algo que ocurre despues de responder, como un bloqueo. */
async function esperar<T>(leer: () => Promise<T>, listo: (valor: T) => boolean = Boolean): Promise<T> {
  let valor = await leer();
  for (let i = 0; i < 30 && !listo(valor); i++) {
    await new Promise((resolve) => setTimeout(resolve, 100));
    valor = await leer();
  }
  return valor;
}

describe('Registro masivo de cuentas (e2e)', () => {
  let t: TestApp;
  let restaurarEnv: () => void;

  beforeAll(async () => {
    restaurarEnv = overrideEnv('THREAT_MODE', 'enforce');
    t = await createTestApp();
  });
  afterAll(async () => {
    // El bloqueo de IP que crea esta suite no debe quedar en la base: otras suites (health) no vacian las tablas.
    await t.prisma.blockRule.deleteMany();
    restaurarEnv?.();
    await t.close();
  });

  const registrar = (n: number) =>
    t.web('post')('/api/auth/register').send({ email: `bot${n}@correo.com`, password: PASSWORD, name: 'Bot Prueba', accountType: 'CLIENT' });

  describeCase('registro masivo (e2e)', {
    que: 'una misma IP registra 8 cuentas nuevas en poco tiempo (escudo mass-registration) con el modelo en enforce',
    espera: 'las 8 se crean; despues la IP queda bloqueada con vencimiento y el noveno registro recibe 403 "Acceso restringido"; queda auditado',
    ejecutar: async () => {
      const estados: number[] = [];
      for (let i = 1; i <= 8; i++) estados.push((await registrar(i)).status);
      const regla = await esperar(() => t.prisma.blockRule.findFirst({ where: { type: 'IP' } }));
      const noveno = await registrar(9);
      const deteccion = await esperar(() => auditLogFirst(t, { where: { action: 'threat.detected', resourceId: 'mass-registration' } }));
      return { estados, regla, noveno, deteccion, cuentas: await t.prisma.user.count() };
    },
    verificar: ({ estados, regla, noveno, deteccion, cuentas }) => {
      expect(estados.every((s) => s === 201)).toBe(true);
      expect(regla).toMatchObject({ type: 'IP', createdBy: 'threat-model' });
      expect(regla!.expiresAt!.getTime()).toBeGreaterThan(Date.now() + 60 * 60_000);
      expect(noveno.status).toBe(403);
      expect(noveno.body.message).toBe('Acceso restringido');
      expect(deteccion).toMatchObject({ metadata: { stride: 'S', blocked: true, mode: 'enforce' } });
      expect(cuentas).toBe(8); // la novena no se creo
    },
    describirObtenido: ({ estados, regla, noveno, cuentas }) =>
      `registros ${estados.join(',')}; bloqueo ${regla?.type} ${regla?.value} hasta ${regla?.expiresAt?.toISOString()}; noveno ${noveno.status} "${noveno.body.message}"; cuentas ${cuentas}`,
  });
});
