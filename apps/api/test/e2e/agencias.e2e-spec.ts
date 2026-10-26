import { AgencyVault } from '../../src/modules/security';
import { describeCase } from '../support/describe-case';
import { jwtPayload, loginUser, registerVerified } from '../support/auth-helpers';
import { propiedadValida } from '../support/property-helpers';
import { createTestApp, type TestApp } from '../support/test-app';

describe('Agencias con subcuentas (e2e)', () => {
  let t: TestApp;
  let admin = { userId: '', accessToken: '', refreshCookie: '' };
  let agente = { userId: '', accessToken: '', refreshCookie: '' };
  let intruso = { userId: '', accessToken: '', refreshCookie: '' };
  let agenciaId = '';
  let propAdmin = '';
  let propAgente = '';
  let memberId = '';

  const con = (token: () => string) => (method: 'get' | 'post' | 'delete' | 'patch') => (url: string) =>
    t.web(method)(url).set('Authorization', `Bearer ${token()}`);
  const a = con(() => admin.accessToken);
  const g = con(() => agente.accessToken);
  const i = con(() => intruso.accessToken);

  beforeAll(async () => {
    t = await createTestApp();
    admin = await registerVerified(t, 'admin@inmobiliaria.com', 'AGENCY', 'Inmuebles Caracas');
    agente = await registerVerified(t, 'agente@inmobiliaria.com', 'CLIENT');
    intruso = await registerVerified(t, 'intruso@correo.com', 'OWNER');
    agenciaId = (await t.prisma.agencyProfile.findFirstOrThrow()).id;
  });
  afterAll(() => t.close());

  describeCase('agencia (e2e)', {
    que: 'el administrador ve su agencia, su rol y el uso de su plan; un cliente comun no',
    espera: 'AGENCY_ADMIN con plan 5 agentes / 100 propiedades; el cliente recibe 403',
    ejecutar: async () => ({ ok: await a('get')('/api/agencies/me'), cliente: (await g('get')('/api/agencies/me')).status }),
    verificar: ({ ok, cliente }) => {
      expect(ok.status).toBe(200);
      expect(ok.body.myRole).toBe('AGENCY_ADMIN');
      expect(ok.body.agency.name).toBe('Inmuebles Caracas');
      expect(ok.body.plan).toMatchObject({ maxAgents: 5, maxProperties: 100, properties: 0, agents: 0 });
      expect(cliente).toBe(403);
    },
    describirObtenido: ({ ok, cliente }) => `${ok.status} rol ${ok.body.myRole}, plan ${JSON.stringify(ok.body.plan)}; cliente ${cliente}`,
  });

  describeCase('agencia (e2e)', {
    que: 'el administrador edita datos de la agencia pero no puede cambiar su propio plan',
    espera: '200 con el telefono nuevo; maxAgents en el body se rechaza con 400; RIF invalido 400',
    ejecutar: async () => ({
      ok: await a('patch')('/api/agencies/me').send({ phone: '+582121234567', description: 'Somos una inmobiliaria con 10 anos.' }),
      plan: (await a('patch')('/api/agencies/me').send({ maxAgents: 999 })).status,
      rif: (await a('patch')('/api/agencies/me').send({ rif: 'xx' })).status,
    }),
    verificar: ({ ok, plan, rif }) => {
      expect(ok.status).toBe(200);
      expect(ok.body.agency.phone).toBe('+582121234567');
      expect(plan).toBe(400);
      expect(rif).toBe(400);
    },
    describirObtenido: ({ ok, plan, rif }) => `edicion ${ok.status}; cambiar plan ${plan}; RIF invalido ${rif}`,
  });

  describeCase('invitaciones (e2e)', {
    que: 'invitar a un agente envia un correo con un enlace; en la base solo se guarda el hash del token',
    espera: '201, miembro PENDING, token del enlace distinto al hash guardado',
    ejecutar: async () => {
      const res = await a('post')('/api/agencies/me/members/invite').send({ email: 'Agente@Inmobiliaria.com' });
      const token = t.mail.lastInvitationToken('agente@inmobiliaria.com');
      const fila = await t.prisma.agencyMember.findFirstOrThrow({ where: { invitedEmailHash: t.app.get(AgencyVault).invitedEmailHash('agente@inmobiliaria.com') } });
      memberId = fila.id;
      return { res, token, fila };
    },
    verificar: ({ res, token, fila }) => {
      expect(res.status).toBe(201);
      expect(fila.invitationStatus).toBe('PENDING');
      expect(fila.invitationTokenHash).not.toBe(token);
      expect(fila.invitationTokenHash).toHaveLength(64);
    },
    describirObtenido: ({ res, fila }) => `${res.status}, estado ${fila.invitationStatus}, hash guardado (${fila.invitationTokenHash?.length} caracteres)`,
  });

  describeCase('invitaciones (e2e)', {
    que: 'solo el administrador invita: un agente o un tercero reciben 403',
    espera: '403 y 403',
    ejecutar: async () => [
      (await i('post')('/api/agencies/me/members/invite').send({ email: 'otro@correo.com' })).status,
      (await g('post')('/api/agencies/me/members/invite').send({ email: 'otro@correo.com' })).status,
    ],
    verificar: (estados) => expect(estados).toEqual([403, 403]),
  });

  describeCase('invitaciones (e2e)', {
    que: 'el token de otra persona o inventado no sirve para aceptar',
    espera: '403 para un usuario con otro correo; 400 para un token falso',
    ejecutar: async () => {
      const token = t.mail.lastInvitationToken('agente@inmobiliaria.com');
      return [
        (await i('post')('/api/agencies/invitations/accept').send({ token })).status,
        (await g('post')('/api/agencies/invitations/accept').send({ token: 'a'.repeat(40) })).status,
      ];
    },
    verificar: (estados) => expect(estados).toEqual([403, 400]),
  });

  describeCase('invitaciones (e2e)', {
    que: 'el invitado acepta con su sesion: entra a la agencia, recibe el rol AGENCY y el token no se puede reusar',
    espera: '200; miembro ACCEPTED; rol AGENCY en la base; segundo intento 400; tras renovar sesion el token lleva AGENCY',
    ejecutar: async () => {
      const token = t.mail.lastInvitationToken('agente@inmobiliaria.com');
      const aceptar = await g('post')('/api/agencies/invitations/accept').send({ token });
      const reuso = await g('post')('/api/agencies/invitations/accept').send({ token });
      const miembro = await t.prisma.agencyMember.findUniqueOrThrow({ where: { id: memberId } });
      const usuario = await t.prisma.user.findUniqueOrThrow({ where: { id: agente.userId } });
      const refresco = await t.web('post')('/api/auth/refresh').set('Cookie', agente.refreshCookie).send({});
      agente.accessToken = refresco.body.accessToken;
      return { aceptar: aceptar.status, reuso: reuso.status, estado: miembro.invitationStatus, hash: miembro.invitationTokenHash, roles: usuario.roles, claims: jwtPayload(refresco.body.accessToken).roles };
    },
    verificar: ({ aceptar, reuso, estado, hash, roles, claims }) => {
      expect(aceptar).toBe(200);
      expect(reuso).toBe(400);
      expect(estado).toBe('ACCEPTED');
      expect(hash).toBeNull();
      expect(roles).toContain('AGENCY');
      expect(claims).toContain('AGENCY');
    },
    describirObtenido: ({ aceptar, reuso, estado, roles, claims }) => `aceptar ${aceptar}, reuso ${reuso}, ${estado}, roles ${JSON.stringify(roles)}, en el token ${JSON.stringify(claims)}`,
  });

  describeCase('invitaciones (e2e)', {
    que: 'respeta el limite de agentes del plan',
    espera: '409 al invitar a un segundo agente cuando maxAgents es 1',
    ejecutar: async () => {
      await t.prisma.agencyProfile.update({ where: { id: agenciaId }, data: { maxAgents: 1 } });
      const res = await a('post')('/api/agencies/me/members/invite').send({ email: 'segundo@inmobiliaria.com' });
      await t.prisma.agencyProfile.update({ where: { id: agenciaId }, data: { maxAgents: 5 } });
      return res;
    },
    verificar: (res) => {
      expect(res.status).toBe(409);
      expect(res.body.message).toContain('hasta 1 agentes');
    },
    describirObtenido: (res) => `${res.status} ${res.body.message}`,
  });

  describeCase('propiedades de agencia (e2e)', {
    que: 'la agencia publica a su nombre y la agencia sale de la cuenta, nunca del body',
    espera: 'admin: agencyId = su agencia, sin agente asignado; agente: agencyId = la misma y asignada a si mismo; agencyId en el body se rechaza',
    ejecutar: async () => {
      const intentoFalso = await a('post')('/api/properties').send(propiedadValida({ agencyId: 'otra-agencia' }));
      const creadaAdmin = await a('post')('/api/properties').send(propiedadValida({ title: 'Propiedad del administrador' }));
      const creadaAgente = await g('post')('/api/properties').send(propiedadValida({ title: 'Propiedad del agente' }));
      propAdmin = creadaAdmin.body.id;
      propAgente = creadaAgente.body.id;
      const filas = await t.prisma.property.findMany({ where: { id: { in: [propAdmin, propAgente] } }, orderBy: { title: 'asc' } });
      return { intentoFalso: intentoFalso.status, estados: [creadaAdmin.status, creadaAgente.status], filas };
    },
    verificar: ({ intentoFalso, estados, filas }) => {
      expect(intentoFalso).toBe(400);
      expect(estados).toEqual([201, 201]);
      const [delAdmin, delAgente] = filas.find((f) => f.id === propAdmin)?.id === propAdmin ? [filas.find((f) => f.id === propAdmin), filas.find((f) => f.id === propAgente)] : [];
      expect(delAdmin?.agencyId).toBe(agenciaId);
      expect(delAdmin?.assignedAgentId).toBeNull();
      expect(delAgente?.agencyId).toBe(agenciaId);
      expect(delAgente?.assignedAgentId).toBe(agente.userId);
    },
    describirObtenido: ({ intentoFalso, estados }) => `agencyId en body: ${intentoFalso}; creadas: ${estados.join(',')}`,
  });

  describeCase('propiedades de agencia (e2e)', {
    que: 'un agente solo gestiona sus propiedades asignadas; el administrador gestiona todas; un tercero ninguna',
    espera: 'agente edita la suya 200 y la del admin 403; admin edita la del agente 200; intruso 403',
    ejecutar: async () => ({
      agenteSuya: (await g('patch')(`/api/properties/${propAgente}`).send({ priceAmount: 600 })).status,
      agenteAjena: (await g('patch')(`/api/properties/${propAdmin}`).send({ priceAmount: 1 })).status,
      adminDelAgente: (await a('patch')(`/api/properties/${propAgente}`).send({ priceAmount: 650 })).status,
      intruso: (await i('patch')(`/api/properties/${propAgente}`).send({ priceAmount: 1 })).status,
    }),
    verificar: (r) => expect(r).toEqual({ agenteSuya: 200, agenteAjena: 403, adminDelAgente: 200, intruso: 403 }),
  });

  describeCase('propiedades de agencia (e2e)', {
    que: 'el administrador asigna una propiedad a un agente; el agente no puede asignar y el asignado debe ser de la agencia',
    espera: 'admin asigna 200; agente asigna 403; asignar a alguien ajeno 400; el agente ya edita la propiedad',
    ejecutar: async () => {
      const antes = (await g('patch')(`/api/properties/${propAdmin}`).send({ priceAmount: 2 })).status;
      const asigna = (await a('patch')(`/api/properties/${propAdmin}/agent`).send({ agentUserId: agente.userId })).status;
      const agenteAsigna = (await g('patch')(`/api/properties/${propAdmin}/agent`).send({ agentUserId: agente.userId })).status;
      const ajeno = (await a('patch')(`/api/properties/${propAdmin}/agent`).send({ agentUserId: intruso.userId })).status;
      const despues = (await g('patch')(`/api/properties/${propAdmin}`).send({ priceAmount: 700 })).status;
      return { antes, asigna, agenteAsigna, ajeno, despues };
    },
    verificar: (r) => expect(r).toEqual({ antes: 403, asigna: 200, agenteAsigna: 403, ajeno: 400, despues: 200 }),
  });

  describeCase('propiedades de agencia (e2e)', {
    que: '"mis propiedades": el administrador ve todas las de la agencia; el agente solo las suyas',
    espera: 'admin 2; agente 2 (ya tiene ambas asignadas); intruso 0',
    ejecutar: async () => [(await a('get')('/api/properties/mine')).body.total, (await g('get')('/api/properties/mine')).body.total, (await i('get')('/api/properties/mine')).body.total],
    verificar: (r) => expect(r).toEqual([2, 2, 0]),
  });

  describeCase('propiedades de agencia (e2e)', {
    que: 'respeta el limite de propiedades del plan',
    espera: '409 al publicar cuando maxProperties ya se alcanzo',
    ejecutar: async () => {
      await t.prisma.agencyProfile.update({ where: { id: agenciaId }, data: { maxProperties: 2 } });
      const res = await a('post')('/api/properties').send(propiedadValida());
      await t.prisma.agencyProfile.update({ where: { id: agenciaId }, data: { maxProperties: 100 } });
      return res;
    },
    verificar: (res) => {
      expect(res.status).toBe(409);
      expect(res.body.message).toContain('hasta 2 propiedades');
    },
    describirObtenido: (res) => `${res.status} ${res.body.message}`,
  });

  describeCase('quitar agente (e2e)', {
    que: 'quitar a un agente le retira el rol, cierra sus sesiones y deja sus propiedades sin asignar',
    espera: '204; sin rol AGENCY; sus sesiones revocadas; propiedades con assignedAgentId nulo; ya no gestiona nada',
    ejecutar: async () => {
      const res = await a('delete')(`/api/agencies/me/members/${memberId}`);
      const usuario = await t.prisma.user.findUniqueOrThrow({ where: { id: agente.userId } });
      const activas = await t.prisma.session.count({ where: { userId: agente.userId, revokedAt: null } });
      const asignadas = await t.prisma.property.count({ where: { assignedAgentId: agente.userId } });
      const nuevoToken = await loginUser(t, 'agente@inmobiliaria.com');
      const gestiona = (await t.web('patch')(`/api/properties/${propAgente}`).set('Authorization', `Bearer ${nuevoToken}`).send({ priceAmount: 1 })).status;
      return { status: res.status, roles: usuario.roles, activas, asignadas, gestiona };
    },
    verificar: ({ status, roles, activas, asignadas, gestiona }) => {
      expect(status).toBe(204);
      expect(roles).not.toContain('AGENCY');
      expect(asignadas).toBe(0);
      expect(activas).toBe(0); // se cuentan ANTES de que el test abra una sesion nueva
      expect(gestiona).toBe(403);
    },
    describirObtenido: ({ status, roles, activas, asignadas, gestiona }) => `${status}, roles ${JSON.stringify(roles)}, sesiones activas ${activas}, propiedades asignadas ${asignadas}, intento de editar ${gestiona}`,
  });

  describeCase('quitar agente (e2e)', {
    que: 'no se puede quitar al administrador de la agencia',
    espera: '400',
    ejecutar: async () => {
      const miembroAdmin = await t.prisma.agencyMember.findFirstOrThrow({ where: { userId: admin.userId } });
      return (await a('delete')(`/api/agencies/me/members/${miembroAdmin.id}`)).status;
    },
    verificar: (status) => expect(status).toBe(400),
  });
});
