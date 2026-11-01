import { AppointmentMessageVault, FieldCipher } from '../../src/modules/security';
import { describeCase } from '../support/describe-case';
import { registerVerified } from '../support/auth-helpers';
import { seedProperty } from '../support/property-helpers';
import { createTestApp, type TestApp } from '../support/test-app';

const enDias = (dias: number, hora = 15) => {
  const fecha = new Date(Date.now() + dias * 24 * 60 * 60 * 1000);
  fecha.setUTCHours(hora, 0, 0, 0);
  return fecha.toISOString();
};

describe('Conversaciones: interesado, pregunta, visita con fechas propuestas (e2e)', () => {
  let t: TestApp;
  let dueno = { userId: '', accessToken: '' };
  let cliente = { userId: '', accessToken: '' };
  let intruso = { userId: '', accessToken: '' };
  let propiedadId = '';
  let citaId = '';
  let fechas: Array<{ id: string; startsAt: string; status: string }> = [];

  const como = (token: () => string) => (method: 'get' | 'post' | 'patch') => (url: string) =>
    t.web(method)(url).set('Authorization', `Bearer ${token()}`);
  const d = como(() => dueno.accessToken);
  const c = como(() => cliente.accessToken);
  const x = como(() => intruso.accessToken);
  const hilo = async (quien: ReturnType<typeof como>) => (await quien('get')(`/api/appointments/${citaId}`)).body;

  beforeAll(async () => {
    t = await createTestApp();
    dueno = await registerVerified(t, 'dueno@correo.com', 'OWNER');
    cliente = await registerVerified(t, 'cliente@correo.com');
    intruso = await registerVerified(t, 'intruso@correo.com', 'OWNER');
    propiedadId = (await seedProperty(t, dueno.userId, { title: 'Apto para conversar' })).id;
    await t.prisma.user.update({ where: { id: dueno.userId }, data: { phone: t.app.get(FieldCipher).encrypt('User.phone', '+584149999999') } });
  });
  afterAll(() => t.close());

  // ---------- Escribir al anunciante ----------

  describeCase('conversaciones (e2e)', {
    que: 'una pregunta necesita texto; un interes se envia sin fecha y abre la conversacion con su primer mensaje',
    espera: '400 pregunta vacia; 201 PENDIENTE con el mensaje como ultimo y sin aviso de nuevo para quien lo escribio',
    ejecutar: async () => {
      const vacia = await c('post')('/api/appointments').send({ propertyId: propiedadId, type: 'PREGUNTA', preferredChannel: 'EMAIL' });
      const interes = await c('post')('/api/appointments').send({ propertyId: propiedadId, type: 'INTERES', message: 'Me interesa, ¿sigue disponible?', preferredChannel: 'EMAIL' });
      citaId = interes.body.id;
      return { vacia: vacia.status, interes };
    },
    verificar: ({ vacia, interes }) => {
      expect(vacia).toBe(400);
      expect(interes.status).toBe(201);
      expect(interes.body.status).toBe('PENDIENTE');
      expect(interes.body.scheduledAt).toBeNull();
      expect(interes.body.lastMessage).toMatchObject({ kind: 'TEXTO', body: 'Me interesa, ¿sigue disponible?', fromClient: true });
      expect(interes.body.unread).toBe(false);
    },
    describirObtenido: ({ vacia, interes }) => `pregunta vacia ${vacia}; interes ${interes.status} ${interes.body.status}`,
  });

  describeCase('conversaciones (e2e)', {
    que: 'el texto del mensaje queda cifrado en la base',
    espera: 'el valor guardado no es el texto plano y se descifra con el vault',
    ejecutar: async () => {
      const fila = await t.prisma.appointmentMessage.findFirstOrThrow({ where: { appointmentId: citaId } });
      return { guardado: fila.body, claro: t.app.get(AppointmentMessageVault).decode(fila).body };
    },
    verificar: ({ guardado, claro }) => {
      expect(guardado).not.toContain('Me interesa');
      expect(claro).toBe('Me interesa, ¿sigue disponible?');
    },
    describirObtenido: ({ guardado }) => `guardado: ${guardado.slice(0, 18)}...`,
  });

  // ---------- Quien ve que ----------

  describeCase('conversaciones (e2e)', {
    que: 'el anunciante ve el mensaje como nuevo; al abrirlo ve el contacto del interesado y deja de estar sin leer',
    espera: 'recibidas: unread true; hilo: viewer manager con contacto; despues unread false',
    ejecutar: async () => {
      const antes = (await d('get')('/api/appointments/received')).body.items.find((i: { id: string }) => i.id === citaId);
      const abierto = await hilo(d);
      const despues = (await d('get')('/api/appointments/received')).body.items.find((i: { id: string }) => i.id === citaId);
      return { antes: antes.unread, abierto, despues: despues.unread };
    },
    verificar: ({ antes, abierto, despues }) => {
      expect(antes).toBe(true);
      expect(abierto.viewer).toBe('manager');
      expect(abierto.contact).toMatchObject({ email: 'cliente@correo.com' });
      expect(abierto.messages).toHaveLength(1);
      expect(despues).toBe(false);
    },
    describirObtenido: ({ antes, abierto, despues }) => `nuevo ${antes}; ${abierto.viewer}; leido ${!despues}`,
  });

  describeCase('conversaciones (e2e)', {
    que: 'el cliente ve la conversacion sin datos de contacto; un tercero no la ve ni escribe en ella',
    espera: 'cliente: viewer client y contact null; intruso: 404 al abrir y al escribir',
    ejecutar: async () => ({
      cliente: await hilo(c),
      abrir: (await x('get')(`/api/appointments/${citaId}`)).status,
      escribir: (await x('post')(`/api/appointments/${citaId}/messages`).send({ body: 'hola' })).status,
    }),
    verificar: ({ cliente: vista, abrir, escribir }) => {
      expect(vista.viewer).toBe('client');
      expect(vista.contact).toBeNull();
      expect(abrir).toBe(404);
      expect(escribir).toBe(404);
    },
    describirObtenido: ({ abrir, escribir }) => `intruso: abrir ${abrir}, escribir ${escribir}`,
  });

  // ---------- Responder y proponer fechas ----------

  describeCase('conversaciones (e2e)', {
    que: 'cuando el anunciante responde, la solicitud pasa a ABIERTA, el cliente la ve como nueva y recibe un aviso por correo',
    espera: 'ABIERTA; cliente unread true; correo appointment-message al cliente',
    ejecutar: async () => {
      const res = await d('post')(`/api/appointments/${citaId}/messages`).send({ body: 'Hola, sigue disponible. ¿Quieres verla?' });
      const mia = (await c('get')('/api/appointments/mine')).body.items.find((i: { id: string }) => i.id === citaId);
      return { res, unread: mia.unread, correo: t.mail.sent.some((m) => m.to === 'cliente@correo.com' && m.template.name === 'appointment-message') };
    },
    verificar: ({ res, unread, correo }) => {
      expect(res.status).toBe(201);
      expect(res.body.status).toBe('ABIERTA');
      expect(unread).toBe(true);
      expect(correo).toBe(true);
    },
    describirObtenido: ({ res, unread, correo }) => `${res.status} ${res.body.status}; cliente nuevo ${unread}; correo ${correo}`,
  });

  describeCase('conversaciones (e2e)', {
    que: 'cada mensaje queda ligado a su fila: el texto cifrado de un mensaje copiado a otro no se puede descifrar',
    espera: 'descifrar el texto del primer mensaje dentro del segundo falla; el segundo se lee bien con el suyo',
    ejecutar: async () => {
      const [primero, segundo] = await t.prisma.appointmentMessage.findMany({ where: { appointmentId: citaId }, orderBy: { createdAt: 'asc' } });
      const vault = t.app.get(AppointmentMessageVault);
      let resultado = 'no fallo';
      try {
        vault.decode({ ...segundo, body: primero.body });
      } catch {
        resultado = 'fallo';
      }
      return { resultado, propio: vault.decode(segundo).body };
    },
    verificar: ({ resultado, propio }) => {
      expect(resultado).toBe('fallo');
      expect(propio).toBe('Hola, sigue disponible. ¿Quieres verla?');
    },
  });

  describeCase('conversaciones (e2e)', {
    que: 'cada quien edita solo sus propios mensajes, dentro de los 3 minutos; el texto editado sigue cifrado y queda la marca "editado"',
    espera: 'el dueno edita el suyo (200); el cliente no el del dueno (403); un tercero 404; el cliente edita el primero y la solicitud conserva el cambio',
    ejecutar: async () => {
      const [delCliente, delDueno] = await t.prisma.appointmentMessage.findMany({ where: { appointmentId: citaId }, orderBy: { createdAt: 'asc' } });
      // Se acerca la hora de envio para estar dentro de la ventana sin depender de la velocidad de la maquina (el orden se conserva).
      await t.prisma.appointmentMessage.update({ where: { id: delCliente.id }, data: { createdAt: new Date(Date.now() - 20_000) } });
      await t.prisma.appointmentMessage.update({ where: { id: delDueno.id }, data: { createdAt: new Date(Date.now() - 10_000) } });

      const url = (id: string) => `/api/appointments/${citaId}/messages/${id}`;
      const dueno200 = await d('patch')(url(delDueno.id)).send({ body: 'Hola, sigue disponible. ¿Te gustaria verla?' });
      const ajeno = (await c('patch')(url(delDueno.id)).send({ body: 'x' })).status;
      const tercero = (await x('patch')(url(delDueno.id)).send({ body: 'x' })).status;
      const cliente200 = await c('patch')(url(delCliente.id)).send({ body: 'Me interesa mucho, ¿sigue disponible?' });

      const fila = await t.prisma.appointmentMessage.findUniqueOrThrow({ where: { id: delDueno.id } });
      const vista = await hilo(c);
      const lead = (await d('get')('/api/appointments/received')).body.items.find((i: { id: string }) => i.id === citaId);
      return { dueno200, ajeno, tercero, cliente200, fila, vista, delDuenoId: delDueno.id, delClienteId: delCliente.id, lead };
    },
    verificar: ({ dueno200, ajeno, tercero, cliente200, fila, vista, delDuenoId, delClienteId, lead }) => {
      expect(dueno200.status).toBe(200);
      expect(dueno200.body.messages.find((m: { id: string }) => m.id === delDuenoId)).toMatchObject({ body: 'Hola, sigue disponible. ¿Te gustaria verla?', editedAt: expect.any(String) });
      expect(ajeno).toBe(403);
      expect(tercero).toBe(404);
      expect(cliente200.status).toBe(200);
      expect(fila.body).not.toContain('Te gustaria');
      expect(fila.editedAt).not.toBeNull();
      // Cada lado solo puede volver a editar lo suyo.
      const delDueno = vista.messages.find((m: { id: string }) => m.id === delDuenoId);
      const delCliente = vista.messages.find((m: { id: string }) => m.id === delClienteId);
      expect(delDueno.editableUntil).toBeNull();
      expect(delCliente.editableUntil).not.toBeNull();
      expect(vista.serverTime).toEqual(expect.any(String));
      expect(lead.message).toBe('Me interesa mucho, ¿sigue disponible?');
    },
    describirObtenido: ({ dueno200, ajeno, tercero, cliente200 }) => `dueno ${dueno200.status}, cliente en mensaje ajeno ${ajeno}, tercero ${tercero}, cliente ${cliente200.status}`,
  });

  describeCase('conversaciones (e2e)', {
    que: 'pasados 3 minutos el mensaje ya no se puede editar (lo hace cumplir el servidor) y deja de ofrecerse como editable',
    espera: '400 y editableUntil null en la conversacion',
    ejecutar: async () => {
      const [, delDueno] = await t.prisma.appointmentMessage.findMany({ where: { appointmentId: citaId }, orderBy: { createdAt: 'asc' } });
      await t.prisma.appointmentMessage.update({ where: { id: delDueno.id }, data: { createdAt: new Date(Date.now() - 4 * 60 * 1000) } });
      const res = await d('patch')(`/api/appointments/${citaId}/messages/${delDueno.id}`).send({ body: 'Tarde' });
      const vista = await hilo(d);
      return { status: res.status, editable: vista.messages.find((m: { id: string }) => m.id === delDueno.id).editableUntil };
    },
    verificar: ({ status, editable }) => {
      expect(status).toBe(400);
      expect(editable).toBeNull();
    },
  });

  describeCase('conversaciones (e2e)', {
    que: 'solo quien gestiona propone fechas, y deben ser futuras y dentro de 90 dias',
    espera: 'cliente 403; fecha pasada 400; a 200 dias 400; sin fechas 400; validas 201 con las fechas por elegir',
    ejecutar: async () => {
      const comoCliente = (await c('post')(`/api/appointments/${citaId}/slots`).send({ slots: [enDias(3)] })).status;
      const pasada = (await d('post')(`/api/appointments/${citaId}/slots`).send({ slots: [enDias(-1)] })).status;
      const lejana = (await d('post')(`/api/appointments/${citaId}/slots`).send({ slots: [enDias(200)] })).status;
      const vacia = (await d('post')(`/api/appointments/${citaId}/slots`).send({ slots: [] })).status;
      const ok = await d('post')(`/api/appointments/${citaId}/slots`).send({ slots: [enDias(3, 15), enDias(4, 10)], note: 'Elige la que te quede mejor' });
      return { comoCliente, pasada, lejana, vacia, ok };
    },
    verificar: ({ comoCliente, pasada, lejana, vacia, ok }) => {
      expect([comoCliente, pasada, lejana, vacia]).toEqual([403, 400, 400, 400]);
      expect(ok.status).toBe(201);
      expect(ok.body.type).toBe('VISITA');
      const propuesta = ok.body.messages.find((m: { kind: string }) => m.kind === 'PROPUESTA');
      expect(propuesta.slots).toHaveLength(2);
      fechas = propuesta.slots;
    },
    describirObtenido: ({ comoCliente, pasada, lejana, vacia, ok }) => `cliente ${comoCliente}, pasada ${pasada}, lejana ${lejana}, vacia ${vacia}; validas ${ok.status}`,
  });

  describeCase('conversaciones (e2e)', {
    que: 'las propuestas de fechas no se editan (solo los mensajes de texto)',
    espera: '400 al editar la propuesta',
    ejecutar: async () => {
      const propuesta = await t.prisma.appointmentMessage.findFirstOrThrow({ where: { appointmentId: citaId, kind: 'PROPUESTA' } });
      return (await d('patch')(`/api/appointments/${citaId}/messages/${propuesta.id}`).send({ body: 'Cambio' })).status;
    },
    verificar: (status) => expect(status).toBe(400),
  });

  describeCase('conversaciones (e2e)', {
    que: 'el cliente acepta una fecha: queda la visita registrada y la otra se descarta; la ficha publica solo dice que hay una visita, sin el dia',
    espera: 'CONFIRMADA con scheduledAt; una ACEPTADA y una DESCARTADA; el dueno no puede aceptar (404); repetir da 400; la ficha: hasScheduledVisit true y sin fecha',
    ejecutar: async () => {
      const ajeno = (await d('patch')(`/api/appointments/${citaId}/slots/${fechas[0].id}/accept`)).status;
      const ok = await c('patch')(`/api/appointments/${citaId}/slots/${fechas[0].id}/accept`);
      const otraVez = (await c('patch')(`/api/appointments/${citaId}/slots/${fechas[1].id}/accept`)).status;
      const ficha = await t.web('get')(`/api/properties/${propiedadId}`);
      return { ajeno, ok, otraVez, ficha };
    },
    verificar: ({ ajeno, ok, otraVez, ficha }) => {
      expect(ajeno).toBe(404);
      expect(ok.status).toBe(200);
      expect(ok.body.status).toBe('CONFIRMADA');
      expect(ok.body.scheduledAt).toBe(fechas[0].startsAt);
      const estados = ok.body.messages.flatMap((m: { slots: Array<{ status: string }> }) => m.slots.map((s) => s.status)).sort();
      expect(estados).toEqual(['ACEPTADA', 'DESCARTADA']);
      expect(ok.body.messages.some((m: { kind: string }) => m.kind === 'ACUERDO')).toBe(true);
      expect(otraVez).toBe(400);
      expect(ficha.body.hasScheduledVisit).toBe(true);
      expect(JSON.stringify(ficha.body)).not.toContain(fechas[0].startsAt);
    },
    describirObtenido: ({ ok, otraVez, ficha }) => `${ok.body.status}; repetir ${otraVez}; ficha hasScheduledVisit=${ficha.body.hasScheduledVisit}`,
  });

  describeCase('conversaciones (e2e)', {
    que: 'el WhatsApp del anunciante solo se entrega a quien tiene sesion',
    espera: 'sin sesion null; con sesion el telefono del dueno',
    ejecutar: async () => ({
      anonimo: (await t.web('get')(`/api/properties/${propiedadId}`)).body.whatsapp,
      conSesion: (await c('get')(`/api/properties/${propiedadId}`)).body.whatsapp,
    }),
    verificar: (r) => expect(r).toEqual({ anonimo: null, conSesion: '+584149999999' }),
  });

  // ---------- Cerrar y reservada del todo ----------

  describeCase('conversaciones (e2e)', {
    que: 'el anunciante cierra la conversacion: ya nadie puede escribir en ella',
    espera: 'COMPLETADA; el cliente recibe 400 al escribir; cerrar de nuevo 400',
    ejecutar: async () => {
      const cierre = await d('patch')(`/api/appointments/${citaId}/close`);
      const escribir = (await c('post')(`/api/appointments/${citaId}/messages`).send({ body: 'gracias' })).status;
      const otraVez = (await d('patch')(`/api/appointments/${citaId}/close`)).status;
      return { cierre: cierre.body.status, escribir, otraVez };
    },
    verificar: (r) => expect(r).toEqual({ cierre: 'COMPLETADA', escribir: 400, otraVez: 400 }),
  });

  describeCase('conversaciones (e2e)', {
    que: 'reservada del todo ya no recibe solicitudes; reservada pero con citas o disponible si',
    espera: 'reservada sin citas: 400; reservada con citas: 201; disponible: acepta de nuevo',
    ejecutar: async () => {
      await d('patch')(`/api/properties/${propiedadId}/status`).send({ status: 'RESERVADA', acceptsVisits: false });
      const cerrada = (await c('post')('/api/appointments').send({ propertyId: propiedadId, type: 'PREGUNTA', message: '¿Aún hay chance?', preferredChannel: 'EMAIL' })).status;
      const ficha = (await t.web('get')(`/api/properties/${propiedadId}`)).body;

      await d('patch')(`/api/properties/${propiedadId}/status`).send({ status: 'RESERVADA', acceptsVisits: true });
      const conCitas = (await c('post')('/api/appointments').send({ propertyId: propiedadId, type: 'PREGUNTA', message: '¿Aún hay chance?', preferredChannel: 'EMAIL' })).status;

      await d('patch')(`/api/properties/${propiedadId}/status`).send({ status: 'PUBLICADA' });
      const libre = (await t.web('get')(`/api/properties/${propiedadId}`)).body.acceptsVisits;
      return { cerrada, acepta: ficha.acceptsVisits, conCitas, libre };
    },
    verificar: (r) => expect(r).toEqual({ cerrada: 400, acepta: false, conCitas: 201, libre: true }),
  });
});
