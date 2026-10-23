import { describeCase } from '../support/describe-case';
import { registerVerified } from '../support/auth-helpers';
import { seedProperty } from '../support/property-helpers';
import { createTestApp, type TestApp } from '../support/test-app';

const enDias = (dias: number) => new Date(Date.now() + dias * 24 * 60 * 60 * 1000).toISOString();

describe('Citas y apartados (e2e)', () => {
  let t: TestApp;
  let dueno = { userId: '', accessToken: '' };
  let cliente1 = { userId: '', accessToken: '' };
  let cliente2 = { userId: '', accessToken: '' };
  let intruso = { userId: '', accessToken: '' };
  let propiedadId = '';
  let visitaId = '';
  let reserva1Id = '';
  let reserva2Id = '';

  const como = (token: () => string) => (method: 'get' | 'post' | 'patch') => (url: string) =>
    t.web(method)(url).set('Authorization', `Bearer ${token()}`);
  const d = como(() => dueno.accessToken);
  const c1 = como(() => cliente1.accessToken);
  const c2 = como(() => cliente2.accessToken);
  const x = como(() => intruso.accessToken);
  const estadoPropiedad = async () => (await t.prisma.property.findUniqueOrThrow({ where: { id: propiedadId } })).status;

  beforeAll(async () => {
    t = await createTestApp();
    dueno = await registerVerified(t, 'dueno@correo.com', 'OWNER');
    cliente1 = await registerVerified(t, 'cliente1@correo.com');
    cliente2 = await registerVerified(t, 'cliente2@correo.com');
    intruso = await registerVerified(t, 'intruso@correo.com', 'OWNER');
    propiedadId = (await seedProperty(t, dueno.userId, { title: 'Apto para citas' })).id;
    await t.prisma.user.update({ where: { id: cliente1.userId }, data: { phone: '+584141111111' } });
  });
  afterAll(() => t.close());

  // ---------- Solicitar ----------

  describeCase('solicitar cita (e2e)', {
    que: 'un visitante sin sesion no puede solicitar, ni el dueno en su propia propiedad',
    espera: '401 y 403',
    ejecutar: async () => [
      (await t.web('post')('/api/appointments').send({ propertyId: propiedadId, type: 'RESERVA' })).status,
      (await d('post')('/api/appointments').send({ propertyId: propiedadId, type: 'RESERVA', contactPhone: '+584140000000' })).status,
    ],
    verificar: (estados) => expect(estados).toEqual([401, 403]),
  });

  describeCase('solicitar cita (e2e)', {
    que: 'valida la fecha de la visita: obligatoria, futura y dentro de 90 dias',
    espera: '400 sin fecha, 400 con fecha pasada, 400 a 200 dias',
    ejecutar: async () => [
      (await c1('post')('/api/appointments').send({ propertyId: propiedadId, type: 'VISITA' })).status,
      (await c1('post')('/api/appointments').send({ propertyId: propiedadId, type: 'VISITA', scheduledAt: enDias(-1) })).status,
      (await c1('post')('/api/appointments').send({ propertyId: propiedadId, type: 'VISITA', scheduledAt: enDias(200) })).status,
    ],
    verificar: (estados) => expect(estados).toEqual([400, 400, 400]),
  });

  describeCase('solicitar cita (e2e)', {
    que: 'el solicitante no puede indicar quien es (clientId/status): se rechazan esos campos',
    espera: '400 por clientId y status',
    ejecutar: async () =>
      c1('post')('/api/appointments').send({ propertyId: propiedadId, type: 'VISITA', scheduledAt: enDias(3), clientId: cliente2.userId, status: 'CONFIRMADA' }),
    verificar: (res) => {
      expect(res.status).toBe(400);
      expect(JSON.stringify(res.body.message)).toContain('clientId');
    },
    describirObtenido: (res) => `${res.status} ${JSON.stringify(res.body.message)}`,
  });

  describeCase('solicitar cita (e2e)', {
    que: 'pedir contacto por WhatsApp exige un telefono (el de la cuenta o uno indicado)',
    espera: '400 si el cliente no tiene telefono; 201 por correo electronico',
    ejecutar: async () => [
      (await c2('post')('/api/appointments').send({ propertyId: propiedadId, type: 'VISITA', scheduledAt: enDias(4) })).status,
      (await c2('post')('/api/appointments').send({ propertyId: propiedadId, type: 'VISITA', scheduledAt: enDias(4), preferredChannel: 'EMAIL' })).status,
    ],
    verificar: (estados) => expect(estados).toEqual([400, 201]),
  });

  describeCase('solicitar cita (e2e)', {
    que: 'una solicitud valida queda a nombre del usuario del token, pendiente, y avisa por correo al dueno',
    espera: '201 PENDIENTE; en la base clientId = token; el dueno recibe el correo appointment-new',
    ejecutar: async () => {
      const res = await c1('post')('/api/appointments').send({ propertyId: propiedadId, type: 'VISITA', scheduledAt: enDias(3), message: 'Me interesa verlo el fin de semana' });
      visitaId = res.body.id;
      const fila = await t.prisma.appointment.findUniqueOrThrow({ where: { id: visitaId } });
      return { res, fila, correo: t.mail.sent.some((m) => m.to === 'dueno@correo.com' && m.template.name === 'appointment-new') };
    },
    verificar: ({ res, fila, correo }) => {
      expect(res.status).toBe(201);
      expect(res.body.status).toBe('PENDIENTE');
      expect(fila.clientId).toBe(cliente1.userId);
      expect(fila.contactPhone).toBe('+584141111111'); // tomado de la cuenta
      expect(correo).toBe(true);
    },
    describirObtenido: ({ res, fila, correo }) => `${res.status} ${res.body.status}, telefono de la cuenta ${fila.contactPhone}, correo al dueno ${correo}`,
  });

  describeCase('solicitar cita (e2e)', {
    que: 'no se aceptan solicitudes pendientes duplicadas para la misma propiedad y tipo',
    espera: '409',
    ejecutar: async () => (await c1('post')('/api/appointments').send({ propertyId: propiedadId, type: 'VISITA', scheduledAt: enDias(5) })).status,
    verificar: (status) => expect(status).toBe(409),
  });

  // ---------- Quien ve que ----------

  describeCase('leads (e2e)', {
    que: 'el cliente ve su solicitud sin datos de contacto internos; el dueno ve el lead con los datos del solicitante',
    espera: 'cliente: 1 solicitud sin "contact"; dueno: 2 leads con telefono y correo del cliente',
    ejecutar: async () => ({ cliente: (await c1('get')('/api/appointments/mine')).body, dueno: (await d('get')('/api/appointments/received')).body }),
    verificar: ({ cliente, dueno: recibidos }) => {
      expect(cliente.total).toBe(1);
      expect(cliente.items[0].contact).toBeUndefined();
      expect(recibidos.total).toBe(2);
      const lead = recibidos.items.find((i: { id: string }) => i.id === visitaId);
      expect(lead.contact).toMatchObject({ name: expect.any(String), phone: '+584141111111', email: 'cliente1@correo.com', channel: 'WHATSAPP' });
    },
    describirObtenido: ({ cliente, dueno: recibidos }) => `cliente ve ${cliente.total}; dueno ve ${recibidos.total} leads (con contacto: ${Boolean(recibidos.items[0]?.contact)})`,
  });

  describeCase('leads (e2e)', {
    que: 'un tercero no ve los leads ajenos ni puede responderlos; un cliente sin rol de dueno no entra a "recibidas"',
    espera: 'intruso ve 0 y recibe 403 al responder; cliente recibe 403 en /received',
    ejecutar: async () => ({
      vistos: (await x('get')('/api/appointments/received')).body.total,
      responder: (await x('patch')(`/api/appointments/${visitaId}/respond`).send({ action: 'CONFIRM' })).status,
      cliente: (await c1('get')('/api/appointments/received')).status,
    }),
    verificar: (r) => expect(r).toEqual({ vistos: 0, responder: 403, cliente: 403 }),
  });

  // ---------- Responder ----------

  describeCase('responder (e2e)', {
    que: 'confirmar una VISITA no cambia la propiedad y avisa al cliente; no se puede responder dos veces',
    espera: 'CONFIRMADA, propiedad sigue PUBLICADA, correo al cliente, segunda respuesta 400',
    ejecutar: async () => {
      const res = await d('patch')(`/api/appointments/${visitaId}/respond`).send({ action: 'CONFIRM', note: 'Te espero el sabado' });
      const otra = await d('patch')(`/api/appointments/${visitaId}/respond`).send({ action: 'REJECT' });
      return { res, otra: otra.status, estado: await estadoPropiedad(), correo: t.mail.sent.some((m) => m.to === 'cliente1@correo.com' && m.template.name === 'appointment-response') };
    },
    verificar: ({ res, otra, estado, correo }) => {
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('CONFIRMADA');
      expect(estado).toBe('PUBLICADA');
      expect(correo).toBe(true);
      expect(otra).toBe(400);
    },
    describirObtenido: ({ res, otra, estado, correo }) => `${res.body.status}, propiedad ${estado}, correo al cliente ${correo}, segunda respuesta ${otra}`,
  });

  describeCase('responder (e2e)', {
    que: 'una visita confirmada se marca como completada',
    espera: 'COMPLETADA; completar una pendiente da 400',
    ejecutar: async () => {
      const ok = await d('patch')(`/api/appointments/${visitaId}/complete`);
      const pendiente = await t.prisma.appointment.findFirstOrThrow({ where: { status: 'PENDIENTE' } });
      const mal = await d('patch')(`/api/appointments/${pendiente.id}/complete`);
      return [ok.body.status, mal.status];
    },
    verificar: (r) => expect(r).toEqual(['COMPLETADA', 400]),
  });

  // ---------- Apartado / reserva ----------

  describeCase('apartado (e2e)', {
    que: 'dos clientes piden apartar la misma propiedad; al confirmar el primero la propiedad pasa a RESERVADA y sigue visible con su insignia',
    espera: 'confirmar #1 => CONFIRMADA, propiedad RESERVADA, en la busqueda con inReservation=true',
    ejecutar: async () => {
      const r1 = await c1('post')('/api/appointments').send({ propertyId: propiedadId, type: 'RESERVA' });
      const r2 = await c2('post')('/api/appointments').send({ propertyId: propiedadId, type: 'RESERVA', preferredChannel: 'EMAIL' });
      reserva1Id = r1.body.id;
      reserva2Id = r2.body.id;
      const confirmar = await d('patch')(`/api/appointments/${reserva1Id}/respond`).send({ action: 'CONFIRM' });
      const enBusqueda = (await t.web('get')('/api/properties')).body.items.find((i: { id: string }) => i.id === propiedadId);
      return { creadas: [r1.status, r2.status], confirmar: confirmar.body.status, estado: await estadoPropiedad(), enBusqueda };
    },
    verificar: ({ creadas, confirmar, estado, enBusqueda }) => {
      expect(creadas).toEqual([201, 201]);
      expect(confirmar).toBe('CONFIRMADA');
      expect(estado).toBe('RESERVADA');
      expect(enBusqueda.inReservation).toBe(true);
    },
    describirObtenido: ({ confirmar, estado, enBusqueda }) => `apartado ${confirmar}; propiedad ${estado}; en la busqueda inReservation=${enBusqueda?.inReservation}`,
  });

  describeCase('apartado (e2e)', {
    que: 'el segundo apartado ya no se puede confirmar (la propiedad esta reservada) y su solicitud sigue pendiente',
    espera: '400 y la solicitud #2 continua PENDIENTE',
    ejecutar: async () => {
      const res = await d('patch')(`/api/appointments/${reserva2Id}/respond`).send({ action: 'CONFIRM' });
      return { status: res.status, estado: (await t.prisma.appointment.findUniqueOrThrow({ where: { id: reserva2Id } })).status };
    },
    verificar: ({ status, estado }) => {
      expect(status).toBe(400);
      expect(estado).toBe('PENDIENTE');
    },
    describirObtenido: ({ status, estado }) => `${status}; la solicitud #2 queda ${estado}`,
  });

  describeCase('apartado (e2e)', {
    que: 'rechazar con un mensaje: el cliente ve la nota. Sobre una propiedad reservada se puede pedir visita pero no otro apartado',
    espera: 'RECHAZADA con nota visible al cliente #2; nueva RESERVA 400; nueva VISITA 201',
    ejecutar: async () => {
      await d('patch')(`/api/appointments/${reserva2Id}/respond`).send({ action: 'REJECT', note: 'Ya fue apartada, gracias' });
      const vista = (await c2('get')('/api/appointments/mine')).body.items.find((i: { id: string }) => i.id === reserva2Id);
      const otraReserva = await c2('post')('/api/appointments').send({ propertyId: propiedadId, type: 'RESERVA', preferredChannel: 'EMAIL' });
      const visita = await c1('post')('/api/appointments').send({ propertyId: propiedadId, type: 'VISITA', scheduledAt: enDias(6) });
      return { vista, otraReserva: otraReserva.status, visita: visita.status };
    },
    verificar: ({ vista, otraReserva, visita }) => {
      expect(vista.status).toBe('RECHAZADA');
      expect(vista.responseNote).toBe('Ya fue apartada, gracias');
      expect(otraReserva).toBe(400);
      expect(visita).toBe(201);
    },
    describirObtenido: ({ vista, otraReserva, visita }) => `${vista.status} "${vista.responseNote}"; otra reserva ${otraReserva}; visita ${visita}`,
  });

  describeCase('apartado (e2e)', {
    que: 'si el cliente cancela su apartado confirmado, la propiedad vuelve a PUBLICADA; no puede cancelar solicitudes ajenas',
    espera: 'CANCELADA y propiedad PUBLICADA; cliente2 recibe 404 al cancelar la del cliente1',
    ejecutar: async () => {
      const ajena = (await c2('patch')(`/api/appointments/${reserva1Id}/cancel`)).status;
      const propia = await c1('patch')(`/api/appointments/${reserva1Id}/cancel`);
      return { ajena, propia: propia.body.status, estado: await estadoPropiedad() };
    },
    verificar: (r) => expect(r).toEqual({ ajena: 404, propia: 'CANCELADA', estado: 'PUBLICADA' }),
  });

  describeCase('apartado (e2e)', {
    que: 'no se aceptan solicitudes sobre una propiedad pausada o alquilada',
    espera: '400 en ambos casos',
    ejecutar: async () => {
      const resultado: number[] = [];
      for (const estado of ['PAUSADA', 'ALQUILADA'] as const) {
        await t.prisma.property.update({ where: { id: propiedadId }, data: { status: estado } });
        resultado.push((await c1('post')('/api/appointments').send({ propertyId: propiedadId, type: 'VISITA', scheduledAt: enDias(8) })).status);
      }
      return resultado;
    },
    verificar: (estados) => expect(estados).toEqual([400, 400]),
  });
});
