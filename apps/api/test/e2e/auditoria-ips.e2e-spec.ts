import { describeCase } from '../support/describe-case';
import { createAdmin, loginAdmin } from '../support/auth-helpers';
import { createTestApp, PASSWORD, totp, type TestApp } from '../support/test-app';
import { AuditService } from '../../src/modules/audit';
import { AuditRetentionService } from '../../src/modules/audit/services/audit-retention.service';

const DAY_MS = 24 * 60 * 60 * 1000;

describe('Auditoria: eventos anonimos, filtro por IP y bloqueo desde el visor (e2e)', () => {
  let t: TestApp;
  let adminToken = '';
  let adminId = '';
  let secret = '';
  let miIp = '';
  let eventoMio = '';

  const admin = (method: 'get' | 'post' | 'delete') => (url: string) => t.web(method)(url).set('Authorization', `Bearer ${adminToken}`);
  const registrar = async (ip: string, action = 'threat.detected') => {
    await t.app.get(AuditService).log({ action, ip, userAgent: 'prueba' });
    const fila = await t.prisma.auditLog.findFirstOrThrow({ where: { action }, orderBy: { createdAt: 'desc' } });
    return fila.id;
  };

  beforeAll(async () => {
    t = await createTestApp();
    ({ userId: adminId, secret } = await createAdmin(t, 'admin-ips@correo.com', true));
    adminToken = await loginAdmin(t, 'admin-ips@correo.com', secret);
  });
  afterAll(() => t.close());

  describeCase('auditoria (e2e)', {
    que: 'un login a una cuenta que no existe deja un evento anonimo, sin el correo escrito',
    espera: '401 al login y un evento auth.login.unknown sin usuario, con IP y sin metadata',
    ejecutar: async () => {
      const login = await t.web('post')('/api/auth/login').send({ email: 'no-existe@correo.com', password: PASSWORD });
      const lista = await admin('get')('/api/admin/audit?anonymous=true&action=auth.login.unknown');
      return { login, lista };
    },
    verificar: ({ login, lista }) => {
      expect(login.status).toBe(401);
      expect(lista.body.items).toHaveLength(1);
      const evento = lista.body.items[0];
      expect(evento.userId).toBeNull();
      expect(evento.ip).toBeTruthy();
      expect(evento.metadata).toBeNull();
      expect(JSON.stringify(lista.body)).not.toContain('no-existe@correo.com');
      miIp = evento.ip;
      eventoMio = evento.id;
    },
    describirObtenido: ({ lista }) => `${lista.body.items.length} evento anonimo, IP ${lista.body.items[0]?.ip}`,
  });

  describeCase('auditoria (e2e)', {
    que: 'el visor filtra por IP, por anonimos y por fechas',
    espera: 'la IP del evento lo encuentra; otra IP no; "anonymous" no trae eventos con usuario; un rango futuro no trae nada',
    ejecutar: async () => ({
      suIp: await admin('get')(`/api/admin/audit?ip=${encodeURIComponent(miIp)}&action=auth.login.unknown`),
      otraIp: await admin('get')('/api/admin/audit?ip=203.0.113.99'),
      anonimos: await admin('get')('/api/admin/audit?anonymous=true'),
      futuro: await admin('get')(`/api/admin/audit?from=${encodeURIComponent(new Date(Date.now() + DAY_MS).toISOString())}`),
      ipMala: await admin('get')('/api/admin/audit?ip=no-es-ip'),
    }),
    verificar: ({ suIp, otraIp, anonimos, futuro, ipMala }) => {
      expect(suIp.body.total).toBe(1);
      expect(otraIp.body.total).toBe(0);
      expect(anonimos.body.items.every((e: { userId: string | null }) => e.userId === null)).toBe(true);
      expect(futuro.body.total).toBe(0);
      expect(ipMala.status).toBe(400);
    },
    describirObtenido: ({ suIp, otraIp, anonimos, futuro }) => `su IP ${suIp.body.total}, otra ${otraIp.body.total}, anonimos ${anonimos.body.total}, futuro ${futuro.body.total}`,
  });

  describeCase('auditoria (e2e)', {
    que: 'se puede bloquear la IP de un evento con un clic, con vencimiento',
    espera: '201 con la IP del evento y vence en ~24 h; repetirlo da 409',
    ejecutar: async () => {
      const id = await registrar('203.0.113.7');
      const primera = await admin('post')('/api/admin/security/from-log').send({ auditLogId: id, reason: 'escaneo', hours: 24 });
      const segunda = await admin('post')('/api/admin/security/from-log').send({ auditLogId: id });
      return { primera, segunda };
    },
    verificar: ({ primera, segunda }) => {
      expect(primera.status).toBe(201);
      expect(primera.body).toMatchObject({ type: 'IP', value: '203.0.113.7', reason: 'escaneo' });
      const horas = (new Date(primera.body.expiresAt).getTime() - Date.now()) / 3_600_000;
      expect(horas).toBeGreaterThan(23);
      expect(horas).toBeLessThanOrEqual(24);
      expect(segunda.status).toBe(409);
    },
    describirObtenido: ({ primera, segunda }) => `${primera.status} (${primera.body.value}), repetido ${segunda.status}`,
  });

  describeCase('auditoria (e2e)', {
    que: 'el admin no puede bloquear su propia IP ni un evento inexistente o sin IP',
    espera: '400 con un evento de su IP; 404 con un id que no existe y con un evento sin IP',
    ejecutar: async () => {
      await t.app.get(AuditService).log({ action: 'evento.sin.ip' });
      const sinIp = await t.prisma.auditLog.findFirstOrThrow({ where: { action: 'evento.sin.ip' } });
      return {
        propia: await admin('post')('/api/admin/security/from-log').send({ auditLogId: eventoMio }),
        inexistente: await admin('post')('/api/admin/security/from-log').send({ auditLogId: '00000000-0000-4000-8000-000000000000' }),
        sinIp: await admin('post')('/api/admin/security/from-log').send({ auditLogId: sinIp.id }),
        reglas: await t.prisma.blockRule.count({ where: { type: 'IP', value: miIp.replace('::ffff:', '') } }),
      };
    },
    verificar: ({ propia, inexistente, sinIp, reglas }) => {
      expect(propia.status).toBe(400);
      expect(inexistente.status).toBe(404);
      expect(sinIp.status).toBe(404);
      expect(reglas).toBe(0);
    },
    describirObtenido: ({ propia, inexistente, sinIp }) => `propia ${propia.status}, inexistente ${inexistente.status}, sin IP ${sinIp.status}`,
  });

  describeCase('auditoria (e2e)', {
    que: 'bloquear una IP pide haber confirmado el segundo factor hace poco',
    espera: '403 RECENT_TWO_FACTOR_REQUIRED con la sesion vencida; tras confirmar, 201',
    ejecutar: async () => {
      const id = await registrar('203.0.113.8');
      await t.prisma.session.updateMany({ where: { userId: adminId, revokedAt: null }, data: { strongAuthAt: new Date(Date.now() - 10 * 60_000) } });
      const vencida = await admin('post')('/api/admin/security/from-log').send({ auditLogId: id });
      await admin('post')('/api/auth/reverify/code').send({ code: totp(secret, 30) });
      const confirmada = await admin('post')('/api/admin/security/from-log').send({ auditLogId: id });
      return { vencida, confirmada };
    },
    verificar: ({ vencida, confirmada }) => {
      expect(vencida.status).toBe(403);
      expect(vencida.body.code).toBe('RECENT_TWO_FACTOR_REQUIRED');
      expect(confirmada.status).toBe(201);
    },
    describirObtenido: ({ vencida, confirmada }) => `vencida ${vencida.status} (${vencida.body.code}), confirmada ${confirmada.status}`,
  });

  describeCase('auditoria (e2e)', {
    que: 'los eventos anonimos se borran a los 5 dias; los que tienen usuario se conservan',
    espera: 'se borra el anonimo de hace 6 dias; quedan el anonimo de hoy y el de usuario de hace 6 dias',
    ejecutar: async () => {
      const crear = (userId: string | null, dias: number, action: string) =>
        t.prisma.auditLog.create({ data: { action, userId, createdAt: new Date(Date.now() - dias * DAY_MS) } });
      await crear(null, 6, 'prueba.anonimo.viejo');
      await crear(null, 1, 'prueba.anonimo.reciente');
      await crear(adminId, 6, 'prueba.usuario.viejo');
      const borrados = await t.app.get(AuditRetentionService).purge();
      const quedan = (await t.prisma.auditLog.findMany({ where: { action: { startsWith: 'prueba.' } } })).map((e) => e.action).sort();
      return { borrados, quedan };
    },
    verificar: ({ borrados, quedan }) => {
      expect(borrados).toBeGreaterThanOrEqual(1);
      expect(quedan).toEqual(['prueba.anonimo.reciente', 'prueba.usuario.viejo']);
    },
    describirObtenido: ({ borrados, quedan }) => `${borrados} borrado(s); quedan ${quedan.join(', ')}`,
  });
});
