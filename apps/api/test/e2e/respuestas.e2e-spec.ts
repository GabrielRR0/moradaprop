import { ReplyTemplateVault } from '../../src/modules/security';
import { describeCase } from '../support/describe-case';
import { registerVerified } from '../support/auth-helpers';
import { createTestApp, type TestApp } from '../support/test-app';

describe('Textos reutilizables: privados y compartidos con el equipo (e2e)', () => {
  let t: TestApp;
  let admin = { userId: '', accessToken: '', refreshCookie: '' };
  let agente = { userId: '', accessToken: '', refreshCookie: '' };
  let dueno = { userId: '', accessToken: '', refreshCookie: '' };
  let cliente = { userId: '', accessToken: '', refreshCookie: '' };
  let privadoId = '';
  let compartidoId = '';
  let delAgenteId = '';

  const como = (token: () => string) => (method: 'get' | 'post' | 'patch' | 'delete') => (url: string) =>
    t.web(method)(url).set('Authorization', `Bearer ${token()}`);
  const a = como(() => admin.accessToken);
  const g = como(() => agente.accessToken);
  const o = como(() => dueno.accessToken);
  const c = como(() => cliente.accessToken);
  const titulos = (res: { body: { items: Array<{ title: string }> } }) => res.body.items.map((i) => i.title).sort();

  beforeAll(async () => {
    t = await createTestApp();
    admin = await registerVerified(t, 'admin@inmobiliaria.com', 'AGENCY', 'Inmuebles Caracas');
    agente = await registerVerified(t, 'agente@inmobiliaria.com', 'CLIENT');
    dueno = await registerVerified(t, 'dueno@correo.com', 'OWNER');
    cliente = await registerVerified(t, 'cliente@correo.com');

    // El agente entra al equipo (invitacion aceptada) y renueva su sesion para que el token lleve el rol AGENCY.
    await a('post')('/api/agencies/me/members/invite').send({ email: 'agente@inmobiliaria.com' });
    await g('post')('/api/agencies/invitations/accept').send({ token: t.mail.lastInvitationToken('agente@inmobiliaria.com') });
    const refresco = await t.web('post')('/api/auth/refresh').set('Cookie', agente.refreshCookie).send({});
    agente.accessToken = refresco.body.accessToken;
  });
  afterAll(() => t.close());

  describeCase('respuestas guardadas (e2e)', {
    que: 'solo quienes publican usan los textos reutilizables; el titulo y el texto se validan',
    espera: 'cliente 403; titulo vacio 400; texto de 1001 caracteres 400',
    ejecutar: async () => [
      (await c('get')('/api/reply-templates')).status,
      (await a('post')('/api/reply-templates').send({ title: '  ', body: 'hola' })).status,
      (await a('post')('/api/reply-templates').send({ title: 'Largo', body: 'x'.repeat(1001) })).status,
    ],
    verificar: (r) => expect(r).toEqual([403, 400, 400]),
  });

  describeCase('respuestas guardadas (e2e)', {
    que: 'un texto privado se guarda cifrado y ligado a su fila: ni el titulo ni el texto estan en claro, y copiarlo a otra fila no lo descifra',
    espera: '201 privado y editable; en la base no se lee el texto; el vault lo descifra; el texto copiado a otra fila falla',
    ejecutar: async () => {
      const res = await a('post')('/api/reply-templates').send({ title: 'Sigue disponible', body: 'Hola {nombre}, {propiedad} sigue disponible.' });
      privadoId = res.body.id;
      const otro = await a('post')('/api/reply-templates').send({ title: 'Otro', body: 'Otro texto' });
      const fila = await t.prisma.replyTemplate.findUniqueOrThrow({ where: { id: privadoId } });
      const filaOtro = await t.prisma.replyTemplate.findUniqueOrThrow({ where: { id: otro.body.id } });
      const vault = t.app.get(ReplyTemplateVault);
      let copiado = 'no fallo';
      try {
        vault.decode({ ...filaOtro, body: fila.body });
      } catch {
        copiado = 'fallo';
      }
      return { res, fila, claro: vault.decode(fila), copiado };
    },
    verificar: ({ res, fila, claro, copiado }) => {
      expect(res.status).toBe(201);
      expect(res.body).toMatchObject({ title: 'Sigue disponible', shared: false, canEdit: true, mine: true });
      expect(fila.title).not.toContain('Sigue');
      expect(fila.body).not.toContain('disponible');
      expect(claro.body).toBe('Hola {nombre}, {propiedad} sigue disponible.');
      expect(copiado).toBe('fallo');
    },
    describirObtenido: ({ res, copiado }) => `${res.status}; copiar a otra fila: ${copiado}`,
  });

  describeCase('respuestas guardadas (e2e)', {
    que: 'quien no pertenece a una inmobiliaria no puede compartir; el administrador si, y el equipo ve lo compartido pero no lo privado',
    espera: 'dueno: canShare false y compartir 400; admin comparte 201; agente ve solo el compartido (con autor) y canShare true',
    ejecutar: async () => {
      const lista = await o('get')('/api/reply-templates');
      const compartirSinEquipo = (await o('post')('/api/reply-templates').send({ title: 'No', body: 'No', shared: true })).status;
      const compartido = await a('post')('/api/reply-templates').send({ title: 'Horario de visitas', body: 'Atendemos de lunes a viernes.', shared: true });
      compartidoId = compartido.body.id;
      const delAgente = await g('get')('/api/reply-templates');
      return { canShareDueno: lista.body.canShare, compartirSinEquipo, compartido, delAgente };
    },
    verificar: ({ canShareDueno, compartirSinEquipo, compartido, delAgente }) => {
      expect(canShareDueno).toBe(false);
      expect(compartirSinEquipo).toBe(400);
      expect(compartido.status).toBe(201);
      expect(compartido.body.shared).toBe(true);
      expect(titulos(delAgente)).toEqual(['Horario de visitas']);
      expect(delAgente.body.canShare).toBe(true);
      expect(delAgente.body.items[0]).toMatchObject({ author: 'Usuario Prueba', canEdit: false, mine: false });
    },
    describirObtenido: ({ compartirSinEquipo, delAgente }) => `compartir sin equipo ${compartirSinEquipo}; agente ve ${titulos(delAgente).join(', ')}`,
  });

  describeCase('respuestas guardadas (e2e)', {
    que: 'el agente comparte el suyo, el administrador puede editarlo pero no ver ni tocar sus privados; el agente no edita lo del administrador',
    espera: 'agente crea compartido 201; admin lo edita 200; admin sobre un privado del agente 404; agente sobre el compartido del admin 404',
    ejecutar: async () => {
      const suyo = await g('post')('/api/reply-templates').send({ title: 'Requisitos', body: 'Cedula y comprobante de ingresos.', shared: true });
      delAgenteId = suyo.body.id;
      const privadoAgente = await g('post')('/api/reply-templates').send({ title: 'Mio', body: 'Solo para mi' });
      return {
        editaAdmin: (await a('patch')(`/api/reply-templates/${delAgenteId}`).send({ body: 'Cedula, comprobante de ingresos y referencias.' })).status,
        tocaPrivado: (await a('patch')(`/api/reply-templates/${privadoAgente.body.id}`).send({ body: 'x' })).status,
        editaAjeno: (await g('patch')(`/api/reply-templates/${compartidoId}`).send({ body: 'x' })).status,
        borraAjeno: (await g('delete')(`/api/reply-templates/${compartidoId}`)).status,
        listaAdmin: titulos(await a('get')('/api/reply-templates')),
      };
    },
    verificar: (r) => {
      expect(r.editaAdmin).toBe(200);
      expect(r.tocaPrivado).toBe(404);
      expect(r.editaAjeno).toBe(404);
      expect(r.borraAjeno).toBe(404);
      expect(r.listaAdmin).toEqual(['Horario de visitas', 'Otro', 'Requisitos', 'Sigue disponible']);
    },
    describirObtenido: (r) => JSON.stringify({ editaAdmin: r.editaAdmin, tocaPrivado: r.tocaPrivado, editaAjeno: r.editaAjeno }),
  });

  describeCase('respuestas guardadas (e2e)', {
    que: 'compartir y dejar de compartir cambia quien lo ve; un texto privado ajeno no existe para los demas',
    espera: 'compartir el privado: el agente lo ve; dejarlo privado: ya no; un tercero recibe 404 al editarlo',
    ejecutar: async () => {
      await a('patch')(`/api/reply-templates/${privadoId}`).send({ shared: true });
      const conEquipo = titulos(await g('get')('/api/reply-templates'));
      await a('patch')(`/api/reply-templates/${privadoId}`).send({ shared: false });
      const sinEquipo = titulos(await g('get')('/api/reply-templates'));
      const tercero = (await o('patch')(`/api/reply-templates/${privadoId}`).send({ title: 'Mio' })).status;
      return { conEquipo, sinEquipo, tercero };
    },
    verificar: ({ conEquipo, sinEquipo, tercero }) => {
      expect(conEquipo).toContain('Sigue disponible');
      expect(sinEquipo).not.toContain('Sigue disponible');
      expect(tercero).toBe(404);
    },
    describirObtenido: ({ conEquipo, sinEquipo, tercero }) => `con equipo: ${conEquipo.length}, sin equipo: ${sinEquipo.length}, tercero ${tercero}`,
  });

  describeCase('respuestas guardadas (e2e)', {
    que: 'borrar un texto lo quita de la lista; la auditoria no guarda el contenido',
    espera: '204; ya no aparece; editarlo da 404; los eventos de auditoria no contienen el texto',
    ejecutar: async () => {
      const borrado = (await a('delete')(`/api/reply-templates/${privadoId}`)).status;
      const despues = titulos(await a('get')('/api/reply-templates'));
      const editar = (await a('patch')(`/api/reply-templates/${privadoId}`).send({ title: 'x' })).status;
      const eventos = await t.prisma.auditLog.findMany({ where: { resource: 'ReplyTemplate' } });
      return { borrado, despues, editar, eventos: JSON.stringify(eventos), cuantos: eventos.length };
    },
    verificar: ({ borrado, despues, editar, eventos, cuantos }) => {
      expect(borrado).toBe(204);
      expect(despues).not.toContain('Sigue disponible');
      expect(editar).toBe(404);
      expect(cuantos).toBeGreaterThan(0);
      expect(eventos).not.toContain('Hola {nombre}');
    },
  });
});
