import request from 'supertest';
import { describeCase } from '../support/describe-case';
import { registerVerified } from '../support/auth-helpers';
import { seedProperty } from '../support/property-helpers';
import { createTestApp, WEB_HEADERS, type TestApp } from '../support/test-app';

describe('GraphQL: busqueda y ficha (e2e)', () => {
  let t: TestApp;
  let dueno = { userId: '', accessToken: '' };
  let cliente = { userId: '', accessToken: '' };
  const ids: Record<string, string> = {};

  /** Ejecuta una consulta GraphQL con las cabeceras de la app web (y token opcional). */
  const gql = (query: string, opts: { token?: string; headers?: Record<string, string> } = {}) => {
    let req = request(t.app.getHttpServer()).post('/api/graphql').set(opts.headers ?? WEB_HEADERS);
    if (opts.token) req = req.set('Authorization', `Bearer ${opts.token}`);
    return req.send({ query });
  };
  const mensajes = (res: request.Response) => (res.body.errors ?? []).map((e: { message: string }) => e.message).join(' | ');
  /** Mensaje + detalle de validacion (Nest lo manda en extensions.originalError). */
  const detalle = (res: request.Response) => JSON.stringify(res.body.errors ?? []);

  beforeAll(async () => {
    t = await createTestApp();
    // Regla de bloqueo creada ANTES de la primera peticion: el cache de reglas ya la incluye.
    await t.prisma.blockRule.create({ data: { type: 'COUNTRY', value: 'XX', reason: 'prueba' } });

    dueno = await registerVerified(t, 'dueno@correo.com', 'OWNER');
    cliente = await registerVerified(t, 'cliente@correo.com');
    ids.A = (await seedProperty(t, dueno.userId, { title: 'Apto Chacao', priceAmount: 450, hasGenerator: true })).id;
    ids.B = (await seedProperty(t, dueno.userId, { title: 'Casa Valencia', priceAmount: 1200, state: 'Carabobo', municipality: 'Valencia' })).id;
    ids.P = (await seedProperty(t, dueno.userId, { title: 'Pausada', status: 'PAUSADA' })).id;
  });
  afterAll(() => t.close());

  describeCase('GraphQL acceso (e2e)', {
    que: 'GraphQL exige las mismas cabeceras de app que REST (no es una puerta trasera)',
    espera: 'sin cabeceras: error "Cliente no autorizado"; con clave falsa tambien; con cabeceras correctas funciona',
    ejecutar: async () => ({
      sin: mensajes(await gql('{ properties { total } }', { headers: {} })),
      falsa: mensajes(await gql('{ properties { total } }', { headers: { 'x-app-client': 'web', 'x-app-key': 'falsa' } })),
      ok: (await gql('{ properties { total } }')).body.data?.properties?.total,
    }),
    verificar: ({ sin, falsa, ok }) => {
      expect(sin).toContain('Cliente no autorizado');
      expect(falsa).toContain('Cliente no autorizado');
      expect(ok).toBe(2);
    },
    describirObtenido: ({ sin, falsa, ok }) => `sin cabeceras: "${sin}"; clave falsa: "${falsa}"; correctas: total ${ok}`,
  });

  describeCase('GraphQL acceso (e2e)', {
    que: 'los bloqueos por pais tambien cortan GraphQL',
    espera: 'con cf-ipcountry: XX error "Acceso restringido"; sin esa cabecera responde normal',
    ejecutar: async () => ({
      bloqueado: mensajes(await gql('{ properties { total } }', { headers: { ...WEB_HEADERS, 'cf-ipcountry': 'XX' } })),
      normal: (await gql('{ properties { total } }')).body.data?.properties?.total,
    }),
    verificar: ({ bloqueado, normal }) => {
      expect(bloqueado).toContain('Acceso restringido');
      expect(normal).toBe(2);
    },
  });

  describeCase('GraphQL busqueda (e2e)', {
    que: 'busca con filtros y devuelve SOLO los campos pedidos',
    espera: 'hasGenerator: true => Apto Chacao; la respuesta contiene exactamente title y priceAmount',
    ejecutar: async () => (await gql('{ properties(hasGenerator: true) { total items { title priceAmount } } }')).body.data.properties,
    verificar: (resultado) => {
      expect(resultado.total).toBe(1);
      expect(resultado.items).toEqual([{ title: 'Apto Chacao', priceAmount: 450 }]);
    },
    describirObtenido: (resultado) => JSON.stringify(resultado),
  });

  describeCase('GraphQL busqueda (e2e)', {
    que: 'da lo mismo que el REST para la misma busqueda (una sola fuente de verdad: PropertiesService)',
    espera: 'mismos titulos en el mismo orden con sort PRICE_ASC / price_asc',
    ejecutar: async () => ({
      graphql: (await gql('{ properties(sort: PRICE_ASC) { items { title } } }')).body.data.properties.items.map((i: { title: string }) => i.title),
      rest: (await t.web('get')('/api/properties?sort=price_asc')).body.items.map((i: { title: string }) => i.title),
    }),
    verificar: ({ graphql, rest }) => expect(graphql).toEqual(rest),
  });

  describeCase('GraphQL busqueda (e2e)', {
    que: 'valida los argumentos como el REST: limite excesivo, enum invalido y campos que no existen',
    espera: 'tres errores y ningun dato',
    ejecutar: async () => [
      detalle(await gql('{ properties(limit: 1000) { total } }')),
      mensajes(await gql('{ properties(type: CASTILLO) { total } }')),
      mensajes(await gql('{ properties(ownerUserId: "x") { total } }')),
    ],
    verificar: (errores) => {
      expect(errores[0]).toContain('limit must not be greater than 50');
      expect(errores[1]).toContain('CASTILLO');
      expect(errores[2]).toContain('ownerUserId');
    },
    describirObtenido: (errores) => errores.map((e) => e.slice(0, 60)).join(' | '),
  });

  describeCase('GraphQL privacidad (e2e)', {
    que: 'los datos internos (dueno, agencia, claves de storage) NO existen en el esquema: no se pueden pedir',
    espera: 'pedir ownerUserId, agencyId u originalKey da error de validacion',
    ejecutar: async () => [
      mensajes(await gql(`{ property(id: "${ids.A}") { ownerUserId } }`)),
      mensajes(await gql(`{ property(id: "${ids.A}") { agencyId } }`)),
      mensajes(await gql(`{ property(id: "${ids.A}") { images { originalKey } } }`)),
    ],
    verificar: (errores) => errores.forEach((e) => expect(e).toContain('Cannot query field')),
    describirObtenido: (errores) => errores.map((e) => e.slice(0, 70)).join(' | '),
  });

  describeCase('GraphQL ficha (e2e)', {
    que: 'la ficha respeta la visibilidad: la propiedad pausada no existe para un visitante pero si para su dueno',
    espera: 'visitante: error "no encontrada"; dueno: canManage=true',
    ejecutar: async () => ({
      visitante: mensajes(await gql(`{ property(id: "${ids.P}") { title } }`)),
      dueno: (await gql(`{ property(id: "${ids.P}") { title canManage } }`, { token: dueno.accessToken })).body.data.property,
    }),
    verificar: ({ visitante, dueno: propia }) => {
      expect(visitante).toContain('no encontrada');
      expect(propia).toEqual({ title: 'Pausada', canManage: true });
    },
    describirObtenido: ({ visitante, dueno: propia }) => `visitante: "${visitante}"; dueno: ${JSON.stringify(propia)}`,
  });

  describeCase('GraphQL ficha (e2e)', {
    que: 'un id que no es UUID se rechaza',
    espera: 'error de validacion',
    ejecutar: async () => mensajes(await gql('{ property(id: "no-es-uuid") { title } }')),
    verificar: (mensaje) => expect(mensaje.toLowerCase()).toContain('uuid'),
  });

  describeCase('GraphQL permisos (e2e)', {
    que: '"mis propiedades" exige sesion y rol de dueno/agencia',
    espera: 'visitante: "Token requerido"; cliente sin rol: "No tienes permiso"; dueno: ve sus 3',
    ejecutar: async () => ({
      visitante: mensajes(await gql('{ myProperties { total } }')),
      cliente: mensajes(await gql('{ myProperties { total } }', { token: cliente.accessToken })),
      dueno: (await gql('{ myProperties { total } }', { token: dueno.accessToken })).body.data.myProperties.total,
    }),
    verificar: ({ visitante, cliente: sinRol, dueno: total }) => {
      expect(visitante).toContain('Token requerido');
      expect(sinRol).toContain('No tienes permiso');
      expect(total).toBe(3);
    },
    describirObtenido: ({ visitante, cliente: sinRol, dueno: total }) => `"${visitante}" | "${sinRol}" | dueno ve ${total}`,
  });

  describeCase('GraphQL mapa (e2e)', {
    que: 'el mapa devuelve pines con su tipo (punto o grupo)',
    espera: '2 propiedades como puntos con propertyId y precio',
    ejecutar: async () => (await gql('{ propertyMap(zoom: 16) { total markers { kind propertyId priceAmount currency } } }')).body.data.propertyMap,
    verificar: (mapa) => {
      expect(mapa.total).toBe(2);
      expect(mapa.markers.every((m: { kind: string; propertyId: string }) => m.kind === 'point' && m.propertyId)).toBe(true);
    },
    describirObtenido: (mapa) => `${mapa.total} propiedades, ${mapa.markers.length} marcadores`,
  });
});
