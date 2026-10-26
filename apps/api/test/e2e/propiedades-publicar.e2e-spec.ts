import { existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import request from 'supertest';
import { describeCase } from '../support/describe-case';
import { registerVerified } from '../support/auth-helpers';
import { fotoJpeg, propiedadValida } from '../support/property-helpers';
import { createTestApp, WEB_HEADERS, type TestApp } from '../support/test-app';

const UPLOADS = join(tmpdir(), 'alquiler-test-uploads');
const enDisco = (bucket: 'public' | 'private', key: string) => existsSync(join(UPLOADS, bucket, key));

describe('Propiedades: publicar, permisos, estados, imagenes y favoritos (e2e)', () => {
  let t: TestApp;
  let dueno = { userId: '', accessToken: '' };
  let otro = { userId: '', accessToken: '' };
  let cliente = { userId: '', accessToken: '' };
  let propiedadId = '';
  let imagenes: Array<{ id: string; thumb: string }> = [];

  const como = (token: string) => (method: 'get' | 'post' | 'delete' | 'patch') => (url: string) =>
    t.web(method)(url).set('Authorization', `Bearer ${token}`);
  const comoDueno = como('' as string);
  void comoDueno;
  const d = (method: 'get' | 'post' | 'delete' | 'patch') => (url: string) => como(dueno.accessToken)(method)(url);
  const o = (method: 'get' | 'post' | 'delete' | 'patch') => (url: string) => como(otro.accessToken)(method)(url);

  beforeAll(async () => {
    t = await createTestApp();
    dueno = await registerVerified(t, 'dueno@correo.com', 'OWNER');
    otro = await registerVerified(t, 'otro@correo.com', 'OWNER');
    cliente = await registerVerified(t, 'cliente@correo.com', 'CLIENT');
  });
  afterAll(() => t.close());

  // ---------- Crear ----------

  describeCase('publicar (e2e)', {
    que: 'un visitante sin token no puede publicar, y un cliente (sin rol de dueno) tampoco',
    espera: '401 y 403',
    ejecutar: async () => [
      (await t.web('post')('/api/properties').send(propiedadValida())).status,
      (await como(cliente.accessToken)('post')('/api/properties').send(propiedadValida())).status,
    ],
    verificar: (estados) => expect(estados).toEqual([401, 403]),
  });

  describeCase('publicar (e2e)', {
    que: 'el cliente no puede escoger dueno, agencia, estado ni fecha: esos campos se rechazan',
    espera: '400 mencionando los campos prohibidos',
    ejecutar: async () =>
      d('post')('/api/properties').send(propiedadValida({ ownerUserId: otro.userId, agencyId: 'x', status: 'ALQUILADA', publishedAt: '2020-01-01' })),
    verificar: (res) => {
      expect(res.status).toBe(400);
      const mensaje = JSON.stringify(res.body.message);
      for (const campo of ['ownerUserId', 'agencyId', 'status', 'publishedAt']) expect(mensaje).toContain(campo);
    },
    describirObtenido: (res) => `${res.status} ${JSON.stringify(res.body.message)}`,
  });

  describeCase('publicar (e2e)', {
    que: 'valida los datos: coordenadas fuera de Venezuela, precio negativo y titulo corto',
    espera: '400 en los tres casos',
    ejecutar: async () => [
      (await d('post')('/api/properties').send(propiedadValida({ latitude: 40.4, longitude: -3.7 }))).status,
      (await d('post')('/api/properties').send(propiedadValida({ priceAmount: -5 }))).status,
      (await d('post')('/api/properties').send(propiedadValida({ title: 'Casa' }))).status,
    ],
    verificar: (estados) => expect(estados).toEqual([400, 400, 400]),
  });

  describeCase('publicar (e2e)', {
    que: 'una publicacion valida queda a nombre del usuario del token, publicada, sin agencia',
    espera: '201; en la base ownerUserId=token, status PUBLICADA, agencyId nulo, publishedAt con fecha',
    ejecutar: async () => {
      const res = await d('post')('/api/properties').send(propiedadValida());
      propiedadId = res.body.id;
      const fila = await t.prisma.property.findUniqueOrThrow({ where: { id: propiedadId } });
      return { res, fila };
    },
    verificar: ({ res, fila }) => {
      expect(res.status).toBe(201);
      expect(fila.ownerUserId).toBe(dueno.userId);
      expect(fila.status).toBe('PUBLICADA');
      expect(fila.agencyId).toBeNull();
      expect(fila.publishedAt).not.toBeNull();
      expect(res.body.canManage).toBe(true);
    },
    describirObtenido: ({ res, fila }) => `${res.status}, dueno=${fila.ownerUserId === dueno.userId ? 'el del token' : 'OTRO'}, estado ${fila.status}, agencia ${fila.agencyId}`,
  });

  // ---------- Permisos ----------

  describeCase('permisos (e2e)', {
    que: 'otro dueno no puede editar, cambiar el estado ni borrar una propiedad ajena',
    espera: '403 en PATCH, status y DELETE; y la propiedad no cambia',
    ejecutar: async () => {
      const editar = await o('patch')(`/api/properties/${propiedadId}`).send({ title: 'Hackeada por otro' });
      const estado = await o('patch')(`/api/properties/${propiedadId}/status`).send({ status: 'PAUSADA' });
      const borrar = await o('delete')(`/api/properties/${propiedadId}`);
      const fila = await t.prisma.property.findUniqueOrThrow({ where: { id: propiedadId } });
      return { estados: [editar.status, estado.status, borrar.status], titulo: fila.title, estado: fila.status };
    },
    verificar: ({ estados, titulo, estado }) => {
      expect(estados).toEqual([403, 403, 403]);
      expect(titulo).not.toBe('Hackeada por otro');
      expect(estado).toBe('PUBLICADA');
    },
    describirObtenido: ({ estados, titulo, estado }) => `${estados.join(',')}; titulo "${titulo}", estado ${estado}`,
  });

  describeCase('permisos (e2e)', {
    que: 'el dueno edita su propiedad, pero el estado no se puede cambiar por el PATCH general',
    espera: 'titulo actualizado (200) y 400 si intenta mandar status',
    ejecutar: async () => {
      const ok = await d('patch')(`/api/properties/${propiedadId}`).send({ title: 'Titulo editado por su dueno', priceAmount: 500 });
      const mal = await d('patch')(`/api/properties/${propiedadId}`).send({ status: 'ALQUILADA' });
      return { ok, mal: mal.status };
    },
    verificar: ({ ok, mal }) => {
      expect(ok.status).toBe(200);
      expect(ok.body.title).toBe('Titulo editado por su dueno');
      expect(ok.body.priceAmount).toBe(500);
      expect(mal).toBe(400);
    },
    describirObtenido: ({ ok, mal }) => `edicion ${ok.status}, intento de cambiar status por PATCH: ${mal}`,
  });

  describeCase('permisos (e2e)', {
    que: '"mis propiedades" solo lista las que el usuario gestiona',
    espera: 'el dueno ve 1; el otro dueno ve 0; un cliente recibe 403',
    ejecutar: async () => [
      (await d('get')('/api/properties/mine')).body.total,
      (await o('get')('/api/properties/mine')).body.total,
      (await como(cliente.accessToken)('get')('/api/properties/mine')).status,
    ],
    verificar: (r) => expect(r).toEqual([1, 0, 403]),
  });

  // ---------- Estados ----------

  describeCase('estados (e2e)', {
    que: 'PUBLICADA -> RESERVADA la deja visible con la insignia "En Proceso de Reserva"',
    espera: '200, inReservation=true y sigue en la busqueda publica',
    ejecutar: async () => {
      const res = await d('patch')(`/api/properties/${propiedadId}/status`).send({ status: 'RESERVADA' });
      const busqueda = await t.web('get')('/api/properties');
      return { res, enBusqueda: busqueda.body.items.find((i: { id: string }) => i.id === propiedadId) };
    },
    verificar: ({ res, enBusqueda }) => {
      expect(res.status).toBe(200);
      expect(res.body.inReservation).toBe(true);
      expect(enBusqueda.status).toBe('RESERVADA');
      expect(enBusqueda.inReservation).toBe(true);
    },
    describirObtenido: ({ res, enBusqueda }) => `${res.status}; en la busqueda: ${enBusqueda?.status}, inReservation=${enBusqueda?.inReservation}`,
  });

  describeCase('estados (e2e)', {
    que: 'rechaza transiciones invalidas (PAUSADA -> RESERVADA) y acepta las validas',
    espera: 'RESERVADA->PAUSADA 200; PAUSADA->RESERVADA 400; PAUSADA->PUBLICADA 200',
    ejecutar: async () => {
      const cambiar = async (status: string) => (await d('patch')(`/api/properties/${propiedadId}/status`).send({ status })).status;
      return [await cambiar('PAUSADA'), await cambiar('RESERVADA'), await cambiar('PUBLICADA')];
    },
    verificar: (estados) => expect(estados).toEqual([200, 400, 200]),
  });

  describeCase('estados (e2e)', {
    que: 'una propiedad pausada desaparece para los visitantes pero su dueno la sigue viendo',
    espera: 'visitante 404, otro dueno 404, dueno 200 con canManage=true',
    ejecutar: async () => {
      await d('patch')(`/api/properties/${propiedadId}/status`).send({ status: 'PAUSADA' });
      const r = [
        (await t.web('get')(`/api/properties/${propiedadId}`)).status,
        (await o('get')(`/api/properties/${propiedadId}`)).status,
        (await d('get')(`/api/properties/${propiedadId}`)).body.canManage,
      ];
      await d('patch')(`/api/properties/${propiedadId}/status`).send({ status: 'PUBLICADA' });
      return r;
    },
    verificar: (r) => expect(r).toEqual([404, 404, true]),
  });

  // ---------- Imagenes ----------

  describeCase('imagenes (e2e)', {
    que: 'sube fotos reales: se guardan 3 variantes publicas y el original en el bucket PRIVADO, en carpetas por propiedad',
    espera: '201; thumb/medium/hd en public/properties/{id}/..., original en private/; la primera es la portada',
    ejecutar: async () => {
      const res = await d('post')(`/api/properties/${propiedadId}/images`)
        .attach('files', await fotoJpeg(), { filename: 'sala.jpg', contentType: 'image/jpeg' })
        .attach('files', await fotoJpeg(1600, 900), { filename: 'cocina.jpg', contentType: 'image/jpeg' });
      const filas = await t.prisma.propertyImage.findMany({ where: { propertyId: propiedadId }, orderBy: { position: 'asc' } });
      imagenes = filas.map((f) => ({ id: f.id, thumb: f.thumbKey }));
      return { res, filas };
    },
    verificar: ({ res, filas }) => {
      expect(res.status).toBe(201);
      expect(filas).toHaveLength(2);
      expect(filas[0].isCover).toBe(true);
      expect(filas[1].isCover).toBe(false);
      for (const f of filas) {
        expect(f.thumbKey).toMatch(new RegExp(`^properties/${propiedadId}/thumb/[0-9a-f-]{36}\\.webp$`));
        expect(f.originalKey).toMatch(new RegExp(`^properties/${propiedadId}/original/[0-9a-f-]{36}\\.jpg$`));
        expect(enDisco('public', f.thumbKey) && enDisco('public', f.mediumKey) && enDisco('public', f.hdKey)).toBe(true);
        expect(enDisco('private', f.originalKey)).toBe(true);
        expect(enDisco('public', f.originalKey)).toBe(false); // el original nunca esta en el bucket publico
      }
    },
    describirObtenido: ({ res, filas }) => `${res.status}, ${filas.length} imagenes, portada: imagen ${filas.findIndex((f) => f.isCover) + 1}; ruta ejemplo ${filas[0]?.thumbKey}`,
  });

  describeCase('imagenes (e2e)', {
    que: 'las variantes se sirven por /uploads, pero el original privado NO es accesible por URL',
    espera: 'thumb 200 image/webp; original 404; intento de salir de la carpeta (..) no funciona',
    ejecutar: async () => {
      const fila = await t.prisma.propertyImage.findFirstOrThrow({ where: { propertyId: propiedadId } });
      const pedir = (ruta: string) => request(t.app.getHttpServer()).get(ruta);
      return {
        thumb: await pedir(`/uploads/${fila.thumbKey}`),
        original: (await pedir(`/uploads/${fila.originalKey}`)).status,
        traversal: (await pedir(`/uploads/../private/${fila.originalKey}`)).status,
      };
    },
    verificar: ({ thumb, original, traversal }) => {
      expect(thumb.status).toBe(200);
      expect(thumb.headers['content-type']).toContain('image/webp');
      expect(original).toBe(404);
      expect(traversal).toBe(404);
    },
    describirObtenido: ({ thumb, original, traversal }) => `thumb ${thumb.status} ${thumb.headers['content-type']}; original ${original}; traversal ${traversal}`,
  });

  describeCase('imagenes (e2e)', {
    que: 'la ficha publica entrega las URLs de las variantes y no las claves internas',
    espera: 'images[] con thumb/medium/hd que empiezan con la URL publica; sin originalKey',
    ejecutar: async () => (await t.web('get')(`/api/properties/${propiedadId}`)).body,
    verificar: (ficha) => {
      expect(ficha.images).toHaveLength(2);
      expect(ficha.cover.thumb).toMatch(/^http:\/\/api\.test\/uploads\/properties\//);
      expect(JSON.stringify(ficha)).not.toContain('originalKey');
      expect(JSON.stringify(ficha)).not.toContain('/original/');
    },
    describirObtenido: (ficha) => `portada: ${ficha.cover.thumb}`,
  });

  describeCase('imagenes (e2e)', {
    que: 'rechaza un archivo falso disfrazado de .jpg (codigo PHP con Content-Type de imagen)',
    espera: '400 "rechazado por seguridad" (lo corta el modelo de amenazas antes de decodificarlo) y no se guarda nada',
    ejecutar: async () => {
      const antes = await t.prisma.propertyImage.count();
      const res = await d('post')(`/api/properties/${propiedadId}/images`).attach('files', Buffer.from('<?php system($_GET["c"]); ?>'), {
        filename: 'foto.jpg',
        contentType: 'image/jpeg',
      });
      return { res, antes, despues: await t.prisma.propertyImage.count() };
    },
    verificar: ({ res, antes, despues }) => {
      expect(res.status).toBe(400);
      expect(res.body.message).toContain('rechazado por seguridad');
      expect(despues).toBe(antes);
    },
    describirObtenido: ({ res, antes, despues }) => `${res.status} "${res.body.message}"; imagenes antes ${antes}, despues ${despues}`,
  });

  describeCase('imagenes (e2e)', {
    que: 'rechaza tipos que no son imagen (PDF) y subir imagenes a propiedades ajenas',
    espera: '400 para el PDF y 403 para el otro dueno',
    ejecutar: async () => [
      (await d('post')(`/api/properties/${propiedadId}/images`).attach('files', Buffer.from('%PDF-1.4'), { filename: 'a.pdf', contentType: 'application/pdf' })).status,
      (await o('post')(`/api/properties/${propiedadId}/images`).attach('files', await fotoJpeg(), { filename: 'a.jpg', contentType: 'image/jpeg' })).status,
    ],
    verificar: (estados) => expect(estados).toEqual([400, 403]),
  });

  describeCase('imagenes (e2e)', {
    que: 'si una de varias imagenes es invalida no se guarda NINGUNA (todo o nada)',
    espera: '400 y la cantidad de imagenes no cambia',
    ejecutar: async () => {
      const antes = await t.prisma.propertyImage.count();
      const res = await d('post')(`/api/properties/${propiedadId}/images`)
        .attach('files', await fotoJpeg(), { filename: 'buena.jpg', contentType: 'image/jpeg' })
        .attach('files', Buffer.from('basura'), { filename: 'mala.jpg', contentType: 'image/jpeg' });
      return [res.status, antes, await t.prisma.propertyImage.count()];
    },
    verificar: ([status, antes, despues]) => {
      expect(status).toBe(400);
      expect(despues).toBe(antes);
    },
    describirObtenido: ([status, antes, despues]) => `${status}; imagenes antes ${antes}, despues ${despues}`,
  });

  describeCase('imagenes (e2e)', {
    que: 'no acepta mas de 10 archivos por peticion',
    espera: '400',
    ejecutar: async () => {
      let req = d('post')(`/api/properties/${propiedadId}/images`);
      const foto = await fotoJpeg(300, 300);
      for (let i = 0; i < 11; i++) req = req.attach('files', foto, { filename: `f${i}.jpg`, contentType: 'image/jpeg' });
      return (await req).status;
    },
    verificar: (status) => expect(status).toBe(400),
  });

  describeCase('imagenes (e2e)', {
    que: 'cambia la portada y, al borrar la portada, otra imagen toma su lugar; los archivos se eliminan',
    espera: 'portada = 2da imagen; borrar la portada deja la restante como portada y borra sus archivos',
    ejecutar: async () => {
      const [primera, segunda] = imagenes;
      const cambio = await d('patch')(`/api/properties/${propiedadId}/images/${segunda.id}/cover`);
      const filaSegunda = await t.prisma.propertyImage.findUniqueOrThrow({ where: { id: segunda.id } });
      const borrar = await d('delete')(`/api/properties/${propiedadId}/images/${segunda.id}`);
      const restante = await t.prisma.propertyImage.findMany({ where: { propertyId: propiedadId } });
      return { cambio: cambio.status, borrar: borrar.status, restante, borradaEnDisco: enDisco('public', filaSegunda.thumbKey) || enDisco('private', filaSegunda.originalKey), primeraId: primera.id };
    },
    verificar: ({ cambio, borrar, restante, borradaEnDisco, primeraId }) => {
      expect([cambio, borrar]).toEqual([200, 204]);
      expect(restante).toHaveLength(1);
      expect(restante[0].id).toBe(primeraId);
      expect(restante[0].isCover).toBe(true);
      expect(borradaEnDisco).toBe(false);
    },
    describirObtenido: ({ cambio, borrar, restante, borradaEnDisco }) => `portada ${cambio}, borrar ${borrar}, quedan ${restante.length} (portada=${restante[0]?.isCover}), archivos borrados: ${!borradaEnDisco}`,
  });

  // ---------- Favoritos ----------

  describeCase('favoritos (e2e)', {
    que: 'un usuario marca y desmarca favoritos, y la ficha refleja si es favorita',
    espera: 'listado con 1, isFavorite=true en la ficha; al quitar queda vacio',
    ejecutar: async () => {
      const c = como(cliente.accessToken);
      await c('post')(`/api/properties/${propiedadId}/favorite`);
      const lista = (await c('get')('/api/properties/favorites')).body;
      const ficha = (await c('get')(`/api/properties/${propiedadId}`)).body;
      await c('delete')(`/api/properties/${propiedadId}/favorite`);
      const vacia = (await c('get')('/api/properties/favorites')).body;
      return { lista: lista.length, esFavorita: ficha.isFavorite, vacia: vacia.length };
    },
    verificar: (r) => expect(r).toEqual({ lista: 1, esFavorita: true, vacia: 0 }),
  });

  describeCase('favoritos (e2e)', {
    que: 'no se pueden marcar favoritos sin sesion ni propiedades pausadas',
    espera: '401 sin token y 404 si la propiedad esta pausada',
    ejecutar: async () => {
      const sinToken = (await request(t.app.getHttpServer()).post(`/api/properties/${propiedadId}/favorite`).set(WEB_HEADERS)).status;
      await d('patch')(`/api/properties/${propiedadId}/status`).send({ status: 'PAUSADA' });
      const pausada = (await como(cliente.accessToken)('post')(`/api/properties/${propiedadId}/favorite`)).status;
      await d('patch')(`/api/properties/${propiedadId}/status`).send({ status: 'PUBLICADA' });
      return [sinToken, pausada];
    },
    verificar: (estados) => expect(estados).toEqual([401, 404]),
  });

  // ---------- Borrar ----------

  describeCase('borrar (e2e)', {
    que: 'borrar una propiedad elimina tambien sus archivos del almacenamiento',
    espera: '204; la fila desaparece y las variantes + el original ya no estan en disco',
    ejecutar: async () => {
      const foto = await fotoJpeg();
      await d('post')(`/api/properties/${propiedadId}/images`).attach('files', foto, { filename: 'x.jpg', contentType: 'image/jpeg' });
      const filas = await t.prisma.propertyImage.findMany({ where: { propertyId: propiedadId } });
      const antes = filas.map((f) => enDisco('public', f.thumbKey) && enDisco('private', f.originalKey));
      const res = await d('delete')(`/api/properties/${propiedadId}`);
      return {
        status: res.status,
        antes,
        existe: await t.prisma.property.count({ where: { id: propiedadId } }),
        despues: filas.map((f) => enDisco('public', f.thumbKey) || enDisco('public', f.hdKey) || enDisco('private', f.originalKey)),
      };
    },
    verificar: ({ status, antes, existe, despues }) => {
      expect(status).toBe(204);
      expect(antes.every(Boolean)).toBe(true);
      expect(existe).toBe(0);
      expect(despues.some(Boolean)).toBe(false);
    },
    describirObtenido: ({ status, antes, existe, despues }) => `${status}; archivos antes: ${antes.length}; propiedad en base: ${existe}; archivos que quedaron: ${despues.filter(Boolean).length}`,
  });
});
