import { describeCase } from '../support/describe-case';
import { createAdmin, loginAdmin, registerVerified } from '../support/auth-helpers';
import { createTestApp, type TestApp } from '../support/test-app';

const EMAIL = 'ana.gonzalez@correo.com';

describe('Cifrado de datos personales (e2e)', () => {
  let t: TestApp;
  let adminToken = '';

  const buscar = async (q: string) => {
    const res = await t.web('get')(`/api/admin/users?q=${encodeURIComponent(q)}`).set('Authorization', `Bearer ${adminToken}`);
    return { status: res.status, correos: (res.body.items as Array<{ email: string }>).map((u) => u.email) };
  };

  beforeAll(async () => {
    t = await createTestApp();
    await registerVerified(t, EMAIL);
    const admin = await createAdmin(t, 'admin@correo.com', true);
    adminToken = await loginAdmin(t, 'admin@correo.com', admin.secret);
  });
  afterAll(() => t.close());

  describeCase('cifrado (e2e)', {
    que: 'quien lee la tabla User directo en la base no ve correo, nombre ni telefono',
    espera: 'email y name guardados como v1.* (cifrados); el correo y el nombre no aparecen en ninguna columna',
    ejecutar: () =>
      t.prisma.$queryRawUnsafe<Array<Record<string, unknown>>>(
        `SELECT email, name, phone, "emailHash", "searchTokens" FROM "User" WHERE "emailHash" <> ''`,
      ),
    verificar: (filas) => {
      expect(filas.length).toBeGreaterThan(0);
      for (const fila of filas) {
        expect(String(fila.email)).toMatch(/^v1\./);
        expect(String(fila.name)).toMatch(/^v1\./);
        const todo = JSON.stringify(fila).toLowerCase();
        for (const claro of ['correo.com', 'gonzalez', 'usuario', 'prueba']) expect(todo).not.toContain(claro);
      }
    },
    describirObtenido: (filas) => `${filas.length} usuarios; ejemplo email "${String(filas[0].email).slice(0, 30)}..."`,
  });

  describeCase('cifrado (e2e)', {
    que: 'el buscador del admin sigue encontrando usuarios por texto parcial de nombre o correo',
    espera: 'prefijos del correo y del nombre encuentran a Ana; un texto ajeno no encuentra a nadie',
    ejecutar: async () => ({
      porCorreoParcial: await buscar('ana.gonz'),
      porCorreoCompleto: await buscar(EMAIL),
      porNombre: await buscar('usuar'),
      porVarias: await buscar('prueba ana'),
      ajeno: await buscar('zzzxx'),
    }),
    verificar: (r) => {
      for (const clave of ['porCorreoParcial', 'porCorreoCompleto', 'porNombre', 'porVarias'] as const) {
        expect(r[clave].status).toBe(200);
        expect(r[clave].correos).toEqual([EMAIL]);
      }
      expect(r.ajeno.correos).toEqual([]);
    },
    describirObtenido: (r) => `parcial ${r.porCorreoParcial.correos.length}, nombre ${r.porNombre.correos.length}, ajeno ${r.ajeno.correos.length}`,
  });

  describeCase('cifrado (e2e)', {
    que: 'el admin ve los datos descifrados al listar, y los filtros por estado siguen funcionando',
    espera: 'la lista trae el correo en claro; filtrar por SUSPENDED no devuelve usuarios activos',
    ejecutar: async () => {
      const todos = await t.web('get')('/api/admin/users').set('Authorization', `Bearer ${adminToken}`);
      const suspendidos = await t.web('get')('/api/admin/users?status=SUSPENDED').set('Authorization', `Bearer ${adminToken}`);
      return { correos: (todos.body.items as Array<{ email: string }>).map((u) => u.email), suspendidos: suspendidos.body.total as number };
    },
    verificar: ({ correos, suspendidos }) => {
      expect(correos).toContain(EMAIL);
      expect(suspendidos).toBe(0);
    },
  });
});
