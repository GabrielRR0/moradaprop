import { describeCase } from '../support/describe-case';
import { registerVerified } from '../support/auth-helpers';
import { csvBuffer, fila, HEADERS, XLSX_MIME, xlsxBuffer } from '../support/sheet-helpers';
import { createTestApp, type TestApp } from '../support/test-app';

describe('Importacion masiva Excel/CSV (e2e)', () => {
  let t: TestApp;
  let admin = { userId: '', accessToken: '' };
  let dueno = { userId: '', accessToken: '' };
  let agenciaId = '';

  const subir = (token: string, buffer: Buffer, filename = 'propiedades.xlsx', contentType = XLSX_MIME) =>
    t.web('post')('/api/imports').set('Authorization', `Bearer ${token}`).attach('file', buffer, { filename, contentType });

  beforeAll(async () => {
    t = await createTestApp();
    admin = await registerVerified(t, 'admin@inmobiliaria.com', 'AGENCY', 'Inmuebles Caracas');
    dueno = await registerVerified(t, 'dueno@correo.com', 'OWNER');
    agenciaId = (await t.prisma.agencyProfile.findFirstOrThrow({ where: { name: 'Inmuebles Caracas' } })).id;
  });
  afterAll(() => t.close());

  describeCase('plantilla (e2e)', {
    que: 'la agencia descarga la plantilla .xlsx y .csv con las columnas correctas',
    espera: 'ambas 200; el CSV trae el encabezado completo; un dueno directo recibe 403',
    ejecutar: async () => {
      const xlsx = await t.web('get')('/api/imports/template.xlsx').set('Authorization', `Bearer ${admin.accessToken}`);
      const csv = await t.web('get')('/api/imports/template.csv').set('Authorization', `Bearer ${admin.accessToken}`).buffer(true);
      const prohibido = await t.web('get')('/api/imports/template.csv').set('Authorization', `Bearer ${dueno.accessToken}`);
      return { xlsx, csv: csv.text ?? csv.body.toString(), prohibido: prohibido.status };
    },
    verificar: ({ xlsx, csv, prohibido }) => {
      expect(xlsx.status).toBe(200);
      expect(xlsx.headers['content-disposition']).toContain('plantilla-propiedades.xlsx');
      expect(csv).toContain(HEADERS.join(','));
      expect(prohibido).toBe(403);
    },
    describirObtenido: ({ xlsx, csv, prohibido }) => `xlsx ${xlsx.status}; csv con ${csv.split(',').length} columnas; dueno directo ${prohibido}`,
  });

  describeCase('importar (e2e)', {
    que: 'importa un .xlsx valido: crea las propiedades de la agencia por lotes y las deja publicadas',
    espera: '201, 3 importadas, 0 fallidas; en la base agencyId=agencia, ownerUserId=token, importJobId asignado',
    ejecutar: async () => {
      const buffer = await xlsxBuffer([fila({ titulo: 'Apto Uno' }), fila({ titulo: 'Apto Dos', precio: '1.250,50' }), fila({ titulo: 'Casa Tres', tipo: 'Casa', moneda: 'Bs', precio: 15000 })]);
      const res = await subir(admin.accessToken, buffer);
      const filas = await t.prisma.property.findMany({ where: { agencyId: agenciaId }, orderBy: { title: 'asc' } });
      return { res, filas };
    },
    verificar: ({ res, filas }) => {
      expect(res.status).toBe(201);
      expect(res.body).toMatchObject({ status: 'COMPLETADA', totalRows: 3, importedRows: 3, failedRows: 0 });
      expect(filas).toHaveLength(3);
      expect(filas.every((f) => f.ownerUserId === admin.userId && f.status === 'PUBLICADA' && f.importJobId === res.body.id)).toBe(true);
      expect(Number(filas.find((f) => f.title === 'Apto Dos')?.priceAmount)).toBe(1250.5); // coma decimal
      expect(filas.find((f) => f.title === 'Casa Tres')).toMatchObject({ type: 'CASA', currency: 'VES' });
    },
    describirObtenido: ({ res, filas }) => `${res.status} ${res.body.status}: ${res.body.importedRows} importadas, ${res.body.failedRows} fallidas; ${filas.length} propiedades en la base`,
  });

  describeCase('importar (e2e)', {
    que: 'valida FILA POR FILA: importa las buenas y reporta las malas con su numero de fila y el motivo',
    espera: 'importadas 1, fallidas 3; errores en las filas 3, 4 y 5 con mensajes en espanol',
    ejecutar: async () => {
      const buffer = await xlsxBuffer([
        fila({ titulo: 'Fila buena' }), // fila 2
        fila({ precio: -10 }), // fila 3: precio invalido
        fila({ tipo: 'castillo' }), // fila 4: tipo invalido
        fila({ latitud: 40.4, longitud: -3.7 }), // fila 5: fuera de Venezuela
      ]);
      const res = await subir(admin.accessToken, buffer);
      return res;
    },
    verificar: (res) => {
      expect(res.body).toMatchObject({ importedRows: 1, failedRows: 3, totalRows: 4 });
      const filas = res.body.errors.map((e: { row: number }) => e.row);
      expect(filas).toEqual([3, 4, 5]);
      expect(JSON.stringify(res.body.errors)).toContain('precio');
      expect(JSON.stringify(res.body.errors)).toContain('latitud');
    },
    describirObtenido: (res) => `${res.body.importedRows} buena, ${res.body.failedRows} malas -> ${JSON.stringify(res.body.errors)}`.slice(0, 260),
  });

  describeCase('importar (e2e)', {
    que: 'neutraliza formulas escritas como texto (=, +, -, @) para evitar inyeccion al exportar a Excel',
    espera: 'el titulo "=HYPERLINK(...)" se guarda como texto con comilla inicial',
    ejecutar: async () => {
      await subir(admin.accessToken, await xlsxBuffer([fila({ titulo: '=HYPERLINK("http://malo.com","click")', descripcion: '@SUM(1+1) descripcion larga de prueba aqui' })]));
      return t.prisma.property.findFirstOrThrow({ where: { title: { contains: 'HYPERLINK' } } });
    },
    verificar: (propiedad) => {
      expect(propiedad.title.startsWith("'=")).toBe(true);
      expect(propiedad.description.startsWith("'@")).toBe(true);
    },
    describirObtenido: (propiedad) => `titulo guardado: ${propiedad.title}`,
  });

  describeCase('importar (e2e)', {
    que: 'rechaza una planilla con celdas de FORMULA de Excel',
    espera: '400 "contiene formulas" y no se crea ninguna propiedad',
    ejecutar: async () => {
      const antes = await t.prisma.property.count();
      const res = await subir(admin.accessToken, await xlsxBuffer([fila({ precio: { formula: '1+1', result: 2 } })]));
      return { res, antes, despues: await t.prisma.property.count() };
    },
    verificar: ({ res, antes, despues }) => {
      expect(res.status).toBe(400);
      expect(res.body.message).toContain('formulas');
      expect(despues).toBe(antes);
    },
    describirObtenido: ({ res, antes, despues }) => `${res.status} "${res.body.message}"; propiedades antes ${antes}, despues ${despues}`,
  });

  describeCase('importar (e2e)', {
    que: 'acepta CSV (con coma o punto y coma, como lo guarda Excel en espanol) y la importacion queda registrada',
    espera: '201 con 2 importadas; el historial de la agencia lista las importaciones con su detalle',
    ejecutar: async () => {
      const coma = await subir(admin.accessToken, csvBuffer([fila({ titulo: 'CSV coma' })]), 'datos.csv', 'text/csv');
      const puntoYComa = await subir(admin.accessToken, csvBuffer([fila({ titulo: 'CSV puntoycoma' })], HEADERS, ';'), 'datos.csv', 'text/csv');
      const historial = await t.web('get')('/api/imports').set('Authorization', `Bearer ${admin.accessToken}`);
      const detalle = await t.web('get')(`/api/imports/${coma.body.id}`).set('Authorization', `Bearer ${admin.accessToken}`);
      return { coma: coma.body, puntoYComa: puntoYComa.body, historial: historial.body, detalle: detalle.body };
    },
    verificar: ({ coma, puntoYComa, historial, detalle }) => {
      expect([coma.importedRows, puntoYComa.importedRows]).toEqual([1, 1]);
      expect(historial.total).toBeGreaterThanOrEqual(4);
      expect(detalle.id).toBe(coma.id);
    },
    describirObtenido: ({ coma, puntoYComa, historial }) => `csv coma ${coma.importedRows}, csv ; ${puntoYComa.importedRows}, historial con ${historial.total} importaciones`,
  });

  describeCase('importar (e2e)', {
    que: 'rechaza archivos que no son planillas: un ejecutable renombrado, un Excel con macros y archivos vacios',
    espera: '400 en los tres',
    ejecutar: async () => [
      (await subir(admin.accessToken, Buffer.from([0x4d, 0x5a, 0x90, 0x00, 0x03]), 'virus.xlsx')).status,
      (await subir(admin.accessToken, Buffer.concat([Buffer.from([0x50, 0x4b, 0x03, 0x04]), Buffer.from('xl/vbaProject.bin')]), 'macros.xlsx')).status,
      (await subir(admin.accessToken, Buffer.alloc(0), 'vacio.csv', 'text/csv')).status,
    ],
    verificar: (estados) => expect(estados).toEqual([400, 400, 400]),
  });

  describeCase('importar (e2e)', {
    que: 'rechaza una planilla a la que le faltan columnas obligatorias',
    espera: '400 nombrando las columnas faltantes y el trabajo queda FALLIDA en el historial',
    ejecutar: async () => {
      const res = await subir(admin.accessToken, await xlsxBuffer([['Casa']], ['titulo']));
      const trabajo = await t.prisma.importJob.findFirstOrThrow({ orderBy: { createdAt: 'desc' } });
      return { res, trabajo };
    },
    verificar: ({ res, trabajo }) => {
      expect(res.status).toBe(400);
      expect(res.body.message).toContain('precio');
      expect(res.body.message).toContain('latitud');
      expect(trabajo.status).toBe('FALLIDA');
    },
    describirObtenido: ({ res, trabajo }) => `${res.status} "${res.body.message}"; trabajo ${trabajo.status}`,
  });
});
