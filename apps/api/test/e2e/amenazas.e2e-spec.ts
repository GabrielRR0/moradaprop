import { describeCase } from '../support/describe-case';
import { createAdmin, loginAdmin, registerVerified } from '../support/auth-helpers';
import { overrideEnv } from '../support/env-helpers';
import { seedProperty } from '../support/property-helpers';
import { createTestApp, type TestApp } from '../support/test-app';

/** Espera (hasta 3 s) a que se cumpla algo que ocurre despues de responder, como un bloqueo o una auditoria. */
async function esperar<T>(leer: () => Promise<T>, listo: (valor: T) => boolean = Boolean): Promise<T> {
  let valor = await leer();
  for (let i = 0; i < 30 && !listo(valor); i++) {
    await new Promise((resolve) => setTimeout(resolve, 100));
    valor = await leer();
  }
  return valor;
}

describe('Modelo de amenazas (e2e)', () => {
  let t: TestApp;
  let adminToken = '';
  let duenoToken = '';
  let duenoId = '';
  let intrusoToken = '';
  let intrusoId = '';
  let propiedadId = '';
  let restaurarEnv: () => void;

  const como = (token: string) => (method: 'get' | 'post' | 'patch' | 'delete') => (url: string) =>
    t.web(method)(url).set('Authorization', `Bearer ${token}`);

  beforeAll(async () => {
    // Esta suite corre con el modelo en "enforce" (bloquea de verdad); las demas suites usan "monitor".
    restaurarEnv = overrideEnv('THREAT_MODE', 'enforce');
    t = await createTestApp();
    ({ accessToken: duenoToken, userId: duenoId } = await registerVerified(t, 'dueno@correo.com', 'OWNER'));
    ({ accessToken: intrusoToken, userId: intrusoId } = await registerVerified(t, 'intruso@correo.com', 'OWNER'));
    const admin = await createAdmin(t, 'admin@correo.com', true);
    adminToken = await loginAdmin(t, 'admin@correo.com', admin.secret);
    propiedadId = (await seedProperty(t, duenoId)).id;
  });

  afterAll(async () => {
    restaurarEnv?.();
    await t.close();
  });

  describeCase('threat-model (e2e)', {
    que: 'el admin abre el mapa del modelo; un usuario normal no',
    espera: 'admin 200 con modo enforce y las 6 letras STRIDE; usuario 403',
    ejecutar: async () => ({
      admin: await como(adminToken)('get')('/api/admin/security/threat-model'),
      usuario: (await como(duenoToken)('get')('/api/admin/security/threat-model')).status,
    }),
    verificar: ({ admin, usuario }) => {
      expect(admin.status).toBe(200);
      expect(admin.body.mode).toBe('enforce');
      const letras = new Set(admin.body.shields.map((s: { stride: string }) => s.stride));
      expect([...letras].sort().join('')).toBe('DEIRST');
      expect(admin.body.fileChecks.map((c: { id: string }) => c.id)).toEqual(
        expect.arrayContaining(['dangerous-filename', 'executable-content']),
      );
      expect(usuario).toBe(403);
    },
    describirObtenido: ({ admin, usuario }) => `admin ${admin.status} (${admin.body.shields?.length} escudos, ${admin.body.fileChecks?.length} revisiones); usuario ${usuario}`,
  });

  describeCase('threat-model (e2e)', {
    que: 'el dueno sube un .php.jpg y un programa de Linux (ELF) disfrazado de foto',
    espera: '400 "rechazado por seguridad" en ambos; auditados como threat.file.rejected con el usuario; no se guarda ninguna imagen',
    ejecutar: async () => {
      const subir = (buffer: Buffer, filename: string) =>
        como(duenoToken)('post')(`/api/properties/${propiedadId}/images`).attach('files', buffer, { filename, contentType: 'image/jpeg' });
      const a = await subir(Buffer.from([0xff, 0xd8, 0xff, 0xe0, 1, 2, 3]), 'foto.php.jpg');
      const b = await subir(Buffer.from([0x7f, 0x45, 0x4c, 0x46, 2, 1, 1, 0]), 'foto.jpg');
      const rechazos = await esperar(
        () => t.prisma.auditLog.findMany({ where: { action: 'threat.file.rejected', userId: duenoId } }),
        (filas) => filas.length >= 2,
      );
      return { estados: [a.status, b.status], mensajes: [a.body.message, b.body.message], rechazos, imagenes: await t.prisma.propertyImage.count() };
    },
    verificar: ({ estados, mensajes, rechazos, imagenes }) => {
      expect(estados).toEqual([400, 400]);
      expect(mensajes).toEqual(['El archivo fue rechazado por seguridad', 'El archivo fue rechazado por seguridad']);
      expect(rechazos.map((r) => r.resourceId).sort()).toEqual(['dangerous-filename', 'executable-content']);
      expect(imagenes).toBe(0);
    },
    describirObtenido: ({ estados, rechazos }) => `${estados.join(',')}; auditado: ${rechazos.map((r) => r.resourceId).join(', ')}`,
  });

  describeCase('threat-model (e2e)', {
    que: 'otro dueno intenta modificar una propiedad ajena',
    espera: '403 (id publico) y queda auditado access.denied con su usuario, el recurso y la accion',
    ejecutar: async () => {
      const res = await como(intrusoToken)('patch')(`/api/properties/${propiedadId}`).send({ title: 'Titulo cambiado por el intruso' });
      const eventos = await esperar(
        () => t.prisma.auditLog.findMany({ where: { action: 'access.denied', userId: intrusoId } }),
        (filas) => filas.length > 0,
      );
      return { res, eventos };
    },
    verificar: ({ res, eventos }) => {
      expect(res.status).toBe(403);
      expect(eventos[0]).toMatchObject({ resource: 'Property', resourceId: propiedadId, metadata: { action: 'manage' } });
    },
    describirObtenido: ({ res, eventos }) => `${res.status}; ${eventos.length} evento(s) access.denied`,
  });

  describeCase('threat-model (e2e)', {
    que: 'un usuario insiste con 10 rutas de admin prohibidas (escudo E) en modo enforce',
    espera: 'se audita threat.detected, se crea un bloqueo USER temporal y su siguiente peticion recibe "Acceso restringido"; el admin y el dueno siguen entrando',
    ejecutar: async () => {
      const intruso = como(intrusoToken);
      for (let i = 0; i < 10; i++) await intruso('get')('/api/admin/security');
      const regla = await esperar(
        () => t.prisma.blockRule.findFirst({ where: { type: 'USER', value: intrusoId } }),
        Boolean,
      );
      const siguiente = await intruso('get')('/api/properties/mine');
      // El registro se escribe justo despues del bloqueo (lleva su resultado): se espera un instante.
      const deteccion = await esperar(
        () => t.prisma.auditLog.findFirst({ where: { action: 'threat.detected', userId: intrusoId } }),
        Boolean,
      );
      return {
        regla,
        deteccion,
        siguiente,
        admin: (await como(adminToken)('get')('/api/admin/security/threat-model')).status,
        dueno: (await como(duenoToken)('get')('/api/properties/mine')).status,
      };
    },
    verificar: ({ regla, deteccion, siguiente, admin, dueno }) => {
      expect(regla).toMatchObject({ type: 'USER', value: intrusoId, createdBy: 'threat-model' });
      expect(regla!.expiresAt!.getTime()).toBeGreaterThan(Date.now());
      expect(deteccion).toMatchObject({ resourceId: 'privilege-probing', metadata: { stride: 'E', blocked: true, mode: 'enforce' } });
      expect(siguiente.status).toBe(403);
      expect(siguiente.body.message).toBe('Acceso restringido');
      expect([admin, dueno]).toEqual([200, 200]);
    },
    describirObtenido: ({ regla, siguiente }) => `bloqueo ${regla?.type} hasta ${regla?.expiresAt?.toISOString()}; siguiente peticion ${siguiente.status} "${siguiente.body.message}"`,
  });
});
