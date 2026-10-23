import { describeCase } from '../support/describe-case';
import { registerVerified } from '../support/auth-helpers';
import { fila, XLSX_MIME, xlsxBuffer } from '../support/sheet-helpers';
import { createTestApp, type TestApp } from '../support/test-app';

/** Segunda mitad de las pruebas de importacion (otra app: el limite de 10 subidas/min es por app). */
describe('Importacion masiva: limites y permisos (e2e)', () => {
  let t: TestApp;
  let admin = { userId: '', accessToken: '' };
  let dueno = { userId: '', accessToken: '' };
  let otraAgencia = { userId: '', accessToken: '' };
  let agenciaId = '';

  const subir = (token: string, buffer: Buffer, filename = 'propiedades.xlsx', contentType = XLSX_MIME) =>
    t.web('post')('/api/imports').set('Authorization', `Bearer ${token}`).attach('file', buffer, { filename, contentType });

  beforeAll(async () => {
    t = await createTestApp();
    admin = await registerVerified(t, 'admin@inmobiliaria.com', 'AGENCY', 'Inmuebles Caracas');
    dueno = await registerVerified(t, 'dueno@correo.com', 'OWNER');
    otraAgencia = await registerVerified(t, 'otra@inmobiliaria.com', 'AGENCY', 'Otra Inmobiliaria');
    agenciaId = (await t.prisma.agencyProfile.findFirstOrThrow({ where: { name: 'Inmuebles Caracas' } })).id;
    // Una importacion previa de la agencia, para probar que otra agencia no la ve.
    await subir(admin.accessToken, await xlsxBuffer([fila({ titulo: 'Previa' })]));
  });
  afterAll(() => t.close());

  describeCase('importar (e2e)', {
    que: 'respeta el limite de propiedades del plan: si la planilla lo excede, no se importa nada',
    espera: '409 y la cantidad de propiedades no cambia',
    ejecutar: async () => {
      const antes = await t.prisma.property.count({ where: { agencyId: agenciaId } });
      await t.prisma.agencyProfile.update({ where: { id: agenciaId }, data: { maxProperties: antes + 1 } });
      const res = await subir(admin.accessToken, await xlsxBuffer([fila({ titulo: 'Propiedad Uno' }), fila({ titulo: 'Propiedad Dos' })]));
      const despues = await t.prisma.property.count({ where: { agencyId: agenciaId } });
      await t.prisma.agencyProfile.update({ where: { id: agenciaId }, data: { maxProperties: 100 } });
      return { res, antes, despues };
    },
    verificar: ({ res, antes, despues }) => {
      expect(res.status).toBe(409);
      expect(despues).toBe(antes);
    },
    describirObtenido: ({ res, antes, despues }) => `${res.status} "${res.body.message}"; propiedades antes ${antes}, despues ${despues}`,
  });

  describeCase('importar (e2e)', {
    que: 'limita las filas por archivo (maximo 500)',
    espera: '400 con 501 filas',
    ejecutar: async () => {
      const res = await subir(admin.accessToken, await xlsxBuffer(Array.from({ length: 501 }, (_, i) => fila({ titulo: `Masiva ${i}` }))));
      return res;
    },
    verificar: (res) => {
      expect(res.status).toBe(400);
      expect(res.body.message).toContain('500 filas');
    },
    describirObtenido: (res) => `${res.status} "${res.body.message}"`,
  });

  describeCase('permisos de importacion (e2e)', {
    que: 'un dueno directo no puede importar, y otra agencia no ve las importaciones ajenas',
    espera: '403 para el dueno; la otra agencia ve 0 importaciones y 404 al pedir una ajena',
    ejecutar: async () => {
      const ajena = await t.prisma.importJob.findFirstOrThrow({ where: { agencyId: agenciaId } });
      return {
        dueno: (await subir(dueno.accessToken, await xlsxBuffer([fila()]))).status,
        listaOtra: (await t.web('get')('/api/imports').set('Authorization', `Bearer ${otraAgencia.accessToken}`)).body.total,
        detalleOtra: (await t.web('get')(`/api/imports/${ajena.id}`).set('Authorization', `Bearer ${otraAgencia.accessToken}`)).status,
      };
    },
    verificar: (r) => expect(r).toEqual({ dueno: 403, listaOtra: 0, detalleOtra: 404 }),
  });
});
