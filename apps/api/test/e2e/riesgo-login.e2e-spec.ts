import { auditLogs, createAdmin, loginAdmin, userByEmail } from '../support/auth-helpers';
import { describeCase } from '../support/describe-case';
import { overrideEnv } from '../support/env-helpers';
import { ATACANTE, CASA, OTRA_RED_VE, UA_MOVIL, VPN_CANADA, cookieDe, esperar, lugares, meta } from '../support/lugares';
import { createTestApp, totp, type TestApp } from '../support/test-app';

/**
 * Riesgo de inicio de sesion (security/access-risk). Los lugares se simulan con las cabeceras que pondria un CDN
 * (ver support/lugares.ts); por eso la suite corre con TRUST_PROXY=true.
 */
let t: TestApp;
const { pedir, crearCuenta, login, eventos } = lugares(() => t);

describe('Riesgo de inicio de sesion: modo enforce (e2e)', () => {
  let restaurarEnv: Array<() => void> = [];
  let anaId = '';
  let ana: { device?: string; refresh?: string; token: string };

  beforeAll(async () => {
    restaurarEnv = [overrideEnv('RISK_MODE', 'enforce'), overrideEnv('THREAT_MODE', 'enforce'), overrideEnv('TRUST_PROXY', 'true')];
    t = await createTestApp();
  });
  afterAll(async () => {
    await t.prisma.blockRule.deleteMany(); // los bloqueos de IP no deben quedar para otras suites
    restaurarEnv.forEach((restaurar) => restaurar());
    await t.close();
  });

  // ---------------- Cuenta sin 2FA ----------------

  describeCase('riesgo de login (e2e)', {
    que: 'la primera entrada de una cuenta (verificar el correo) es la linea base',
    espera: '200; cookie device_token; dispositivo CONFIRMADO en la base; pais y red recordados; ningun aviso',
    ejecutar: async () => {
      const r = await crearCuenta('ana@correo.com', CASA);
      anaId = (await userByEmail(t, 'ana@correo.com')).id;
      ana = { device: r.device, refresh: r.refresh, token: r.token };
      return {
        status: r.res.status,
        cookie: r.device,
        dispositivos: await t.prisma.trustedDevice.findMany({ where: { userId: anaId } }),
        huellas: await t.prisma.loginFootprint.findMany({ where: { userId: anaId } }),
        avisos: await eventos(anaId, 'risk.assessed'),
        sesion: await t.prisma.session.findFirst({ where: { userId: anaId } }),
      };
    },
    verificar: ({ status, cookie, dispositivos, huellas, avisos, sesion }) => {
      expect(status).toBe(200);
      expect(cookie).toEqual(expect.any(String));
      expect(dispositivos).toHaveLength(1);
      expect(dispositivos[0]).toMatchObject({ label: 'Chrome en Windows', confirmedAt: expect.any(Date), lastCountry: 'VE' });
      expect(dispositivos[0].secretHash).not.toBe(cookie); // en la base solo el hash, nunca el secreto
      expect(huellas.map((h) => h.kind).sort()).toEqual(['COUNTRY', 'NETWORK']);
      expect(huellas.find((h) => h.kind === 'COUNTRY')?.value).toBe('VE');
      expect(huellas.find((h) => h.kind === 'NETWORK')?.value).not.toContain('190.10.10'); // la red va como HMAC, no la IP
      expect(avisos).toHaveLength(0);
      expect(sesion).toMatchObject({ deviceId: dispositivos[0].id, country: 'VE' });
    },
    describirObtenido: ({ dispositivos, huellas }) => `${dispositivos.length} dispositivo confirmado, huellas: ${huellas.map((h) => h.kind).join('+')}`,
  });

  describeCase('riesgo de login (e2e)', {
    que: 'su mismo equipo desde otra red del mismo pais',
    espera: '200 sin verificacion y sin avisos (el dispositivo confirmado resta riesgo)',
    ejecutar: async () => {
      const res = await login('ana@correo.com', { ...OTRA_RED_VE, device: ana.device });
      return { res, avisos: await auditLogs(t, { where: { userId: anaId, action: { startsWith: 'risk.' } } }) };
    },
    verificar: ({ res, avisos }) => {
      expect(res.status).toBe(200);
      expect(res.body.accessToken).toEqual(expect.any(String));
      expect(avisos.filter((a) => a.action !== 'risk.device.confirmed')).toHaveLength(0);
    },
  });

  describeCase('riesgo de login (e2e)', {
    que: 'usuario con VPN: su equipo de siempre desde Canada',
    espera: '200 (MEDIO, no se le pide nada) con aviso en su historial: pais CA, dispositivo "Chrome en Windows"',
    ejecutar: async () => {
      const res = await login('ana@correo.com', { ...VPN_CANADA, device: ana.device });
      const aviso = (await eventos(anaId, 'risk.assessed'))[0];
      const historial = await pedir('get', '/api/auth/security-events', { ...VPN_CANADA, device: ana.device }, undefined, res.body.accessToken);
      return { res, aviso, historial };
    },
    verificar: ({ res, aviso, historial }) => {
      expect(res.status).toBe(200);
      expect(aviso.metadata).toMatchObject({ level: 'MEDIUM', country: 'CA', device: 'Chrome en Windows', outcome: 'allowed' });
      expect(historial.status).toBe(200);
      expect(historial.body.items[0]).toMatchObject({ type: 'risk.assessed', level: 'MEDIUM', country: 'CA', device: 'Chrome en Windows' });
      expect(JSON.stringify(historial.body)).not.toContain('45.30.30'); // el historial no expone IPs
    },
    describirObtenido: ({ res, aviso }) => `${res.status}; aviso ${JSON.stringify(aviso.metadata)}`,
  });

  describeCase('riesgo de login (e2e)', {
    que: 'atacante con la clave correcta: Francia, equipo nuevo, sin cookie, y la cuenta no tiene 2FA',
    espera: '403 SECOND_FACTOR_REQUIRED; auditado risk.denied (ALTO); no se crea sesion; Francia NO se recuerda',
    ejecutar: async () => {
      const sesionesAntes = await t.prisma.session.count({ where: { userId: anaId } });
      const res = await login('ana@correo.com', ATACANTE);
      return {
        res,
        sesionesAntes,
        sesionesDespues: await t.prisma.session.count({ where: { userId: anaId } }),
        denegado: await esperar(() => eventos(anaId, 'risk.denied'), (f) => f.length > 0),
        huellas: await t.prisma.loginFootprint.findMany({ where: { userId: anaId, kind: 'COUNTRY' } }),
      };
    },
    verificar: ({ res, sesionesAntes, sesionesDespues, denegado, huellas }) => {
      expect(res.status).toBe(403);
      expect(res.body.code).toBe('SECOND_FACTOR_REQUIRED');
      expect(res.body.accessToken).toBeUndefined();
      expect(sesionesDespues).toBe(sesionesAntes);
      expect(denegado[0].metadata).toMatchObject({ level: 'HIGH', country: 'FR', outcome: 'denied' });
      expect(huellas.map((h) => h.value).sort()).toEqual(['CA', 'VE']);
    },
    describirObtenido: ({ res, denegado }) => `${res.status} ${res.body.code}; ${JSON.stringify((meta(denegado[0]).reasons as Array<{ signal: string }> | undefined)?.map((r) => r.signal))}`,
  });

  describeCase('riesgo de login (e2e)', {
    que: 'el atacante NO conoce la clave',
    espera: '401 "Credenciales invalidas" como siempre: el analisis de riesgo no revela nada antes de acertar la clave',
    ejecutar: () => pedir('post', '/api/auth/login', ATACANTE, { email: 'ana@correo.com', password: 'Otra12345' }),
    verificar: (res) => {
      expect(res.status).toBe(401);
      expect(res.body.message).toBe('Credenciales invalidas');
      expect(res.body.code).toBeUndefined();
    },
  });

  // ---------------- Robo de sesion (refresh) ----------------

  describeCase('riesgo de login (e2e)', {
    que: 'un refresh token robado: se usa SIN el dispositivo de la sesion',
    espera: '401, la sesion queda revocada y auditado risk.session.revoked (device-mismatch)',
    ejecutar: async () => {
      const entrada = await login('ana@correo.com', { ...CASA, device: ana.device });
      const refresh = cookieDe(entrada, 'refresh_token');
      const robado = await pedir('post', '/api/auth/refresh', { ...CASA, refresh }, {});
      const legitimo = await pedir('post', '/api/auth/refresh', { ...CASA, refresh, device: ana.device }, {});
      return { robado, legitimo, evento: await esperar(() => eventos(anaId, 'risk.session.revoked'), (f) => f.length > 0) };
    },
    verificar: ({ robado, legitimo, evento }) => {
      expect(robado.status).toBe(401);
      expect(legitimo.status).toBe(401); // la sesion ya quedo revocada: el refresh original no sirve ni con el dispositivo
      expect(evento[0].metadata).toMatchObject({ reason: 'device-mismatch', revoked: true });
    },
    describirObtenido: ({ robado, evento }) => `${robado.status}; ${JSON.stringify(evento[0]?.metadata)}`,
  });

  describeCase('riesgo de login (e2e)', {
    que: 'refresh legitimo: con el dispositivo de la sesion, aunque ahora sea otro pais (VPN o viaje)',
    espera: '200 y aviso MEDIO "la sesion paso de VE a DE"',
    ejecutar: async () => {
      const entrada = await login('ana@correo.com', { ...CASA, device: ana.device });
      const refresh = cookieDe(entrada, 'refresh_token');
      const res = await pedir('post', '/api/auth/refresh', { ip: '5.5.5.5', country: 'DE', refresh, device: ana.device }, {});
      const avisos = await eventos(anaId, 'risk.assessed');
      return { res, aviso: avisos.find((a) => JSON.stringify(a.metadata).includes('refresh-new-country')) };
    },
    verificar: ({ res, aviso }) => {
      expect(res.status).toBe(200);
      expect(res.body.accessToken).toEqual(expect.any(String));
      expect(aviso?.metadata).toMatchObject({ level: 'MEDIUM', country: 'DE' });
    },
  });

  // ---------------- Dispositivos del usuario ----------------

  describeCase('riesgo de login (e2e)', {
    que: 'dispositivos: el usuario ve los suyos, otro usuario no puede quitarlos, y quitar uno cierra sus sesiones',
    espera: 'lista con "current"; ajeno 404; propio 204; su sesion deja de renovarse y su secreto deja de servir',
    ejecutar: async () => {
      // Segundo dispositivo: el telefono, desde su casa (MEDIO: entra, pero queda SIN confirmar).
      const movil = { ...CASA, ua: UA_MOVIL };
      const entrada = await login('ana@correo.com', movil);
      const deviceMovil = cookieDe(entrada, 'device_token') as string;
      const refreshMovil = cookieDe(entrada, 'refresh_token');

      const lista = await pedir('get', '/api/auth/devices', { ...CASA, device: ana.device }, undefined, ana.token);
      const idMovil = lista.body.items.find((d: { label: string }) => d.label === 'Safari en iOS')?.id as string;

      const bob = await crearCuenta('bob@correo.com', { ip: '190.99.99.99', country: 'VE' });
      const ajeno = await pedir('delete', `/api/auth/devices/${idMovil}`, { ip: '190.99.99.99', country: 'VE', device: bob.device }, undefined, bob.token);
      const propio = await pedir('delete', `/api/auth/devices/${idMovil}`, { ...CASA, device: ana.device }, undefined, ana.token);
      const renovar = await pedir('post', '/api/auth/refresh', { ...movil, refresh: refreshMovil, device: deviceMovil }, {});
      const despues = await pedir('get', '/api/auth/devices', { ...CASA, device: ana.device }, undefined, ana.token);
      return { entrada: entrada.status, lista, idMovil, ajeno: ajeno.status, propio: propio.status, renovar: renovar.status, despues };
    },
    verificar: ({ entrada, lista, ajeno, propio, renovar, despues }) => {
      expect(entrada).toBe(200);
      expect(lista.status).toBe(200);
      expect(lista.body.items).toHaveLength(2);
      expect(lista.body.items.filter((d: { current: boolean }) => d.current)).toHaveLength(1);
      expect(lista.body.items.find((d: { label: string }) => d.label === 'Safari en iOS').confirmed).toBe(false);
      expect(JSON.stringify(lista.body)).not.toContain('secret');
      expect(ajeno).toBe(404);
      expect(propio).toBe(204);
      expect(renovar).toBe(401);
      expect(despues.body.items).toHaveLength(1);
    },
    describirObtenido: ({ lista, ajeno, propio, renovar, despues }) => `lista ${lista.body.items?.length}; ajeno ${ajeno}; propio ${propio}; refresh del movil ${renovar}; quedan ${despues.body.items?.length}`,
  });

  // ---------------- Cuenta CON 2FA ----------------

  describeCase('riesgo de login (e2e)', {
    que: 'cuenta con 2FA: atacante con la clave desde Francia con equipo nuevo',
    espera: 'desafio con unusual=true y metodos [totp, backup] (sin correo); pedir el codigo por correo da 403',
    ejecutar: async () => {
      const { secret } = await createAdmin(t, 'root@correo.com', true);
      const lugar = { ip: '190.50.50.50', country: 'VE' };
      // Linea base: primera entrada, con TOTP.
      const primera = await login('root@correo.com', lugar);
      const base = await pedir('post', '/api/auth/login/2fa', lugar, { challengeToken: primera.body.challengeToken, code: totp(secret, 0) });

      const ataque = { ip: '82.60.60.60', country: 'FR', ua: UA_MOVIL };
      const desafio = await login('root@correo.com', ataque);
      const porCorreo = await pedir('post', '/api/auth/login/2fa/email-code', ataque, { challengeToken: desafio.body.challengeToken });
      return { primera: primera.body, base: base.status, baseDevice: cookieDe(base, 'device_token'), desafio: desafio.body, porCorreo: porCorreo.status, secret };
    },
    verificar: ({ primera, base, baseDevice, desafio, porCorreo }) => {
      expect(primera.twoFactorRequired).toBe(true);
      expect(primera.unusual).toBe(false); // linea base: nada raro
      expect(primera.methods).toContain('email');
      expect(base).toBe(200);
      expect(baseDevice).toEqual(expect.any(String));
      expect(desafio.twoFactorRequired).toBe(true);
      expect(desafio.unusual).toBe(true);
      expect(desafio.methods).toEqual(['totp', 'backup']);
      expect(desafio.accessToken).toBeUndefined();
      expect(porCorreo).toBe(403);
    },
    describirObtenido: ({ desafio, porCorreo }) => `metodos ${JSON.stringify(desafio.methods)}, unusual ${desafio.unusual}; correo ${porCorreo}`,
  });

  describeCase('riesgo de login (e2e)', {
    que: 'el atacante falla el segundo factor 3 veces',
    espera: 'cuenta bloqueada 30 min, auditado (3 fallos + bloqueo), el hecho cuenta contra el escudo account-takeover-attempt (que bloquea la IP al 3er bloqueo) y la VICTIMA no queda bloqueada por usuario',
    ejecutar: async () => {
      const ataque = { ip: '82.60.60.60', country: 'FR', ua: UA_MOVIL };
      const root = await userByEmail(t, 'root@correo.com');
      const desafio = await login('root@correo.com', ataque);
      const intentos: number[] = [];
      for (let i = 0; i < 3; i++) {
        intentos.push((await pedir('post', '/api/auth/login/2fa', ataque, { challengeToken: desafio.body.challengeToken, code: '000000' })).status);
      }
      const usuario = await userByEmail(t, 'root@correo.com');
      return {
        intentos,
        bloqueadaHasta: usuario.lockedUntil,
        fallos: await eventos(root.id, 'risk.stepup.failed'),
        bloqueo: await eventos(root.id, 'risk.account.locked'),
        reglaUsuario: await t.prisma.blockRule.findFirst({ where: { type: 'USER', value: root.id } }),
        siguiente: await login('root@correo.com', ataque),
      };
    },
    verificar: ({ intentos, bloqueadaHasta, fallos, bloqueo, reglaUsuario, siguiente }) => {
      expect(intentos).toEqual([401, 401, 401]);
      expect(bloqueadaHasta!.getTime()).toBeGreaterThan(Date.now() + 25 * 60_000);
      expect(fallos).toHaveLength(3);
      expect(bloqueo).toHaveLength(1);
      expect(reglaUsuario).toBeNull(); // la victima no se bloquea por usuario: solo su cuenta queda en pausa 30 min
      expect(siguiente.status).toBe(403);
      expect(siguiente.body.message).toContain('bloqueada temporalmente'); // aun con la clave correcta, ni el atacante ni nadie entra
    },
    describirObtenido: ({ intentos, fallos, bloqueo, siguiente }) => `${intentos.join(',')}; ${fallos.length} fallos, ${bloqueo.length} bloqueo; con la clave correcta ${siguiente.status} "${siguiente.body.message}"`,
  });

  describeCase('riesgo de login (e2e)', {
    que: 'el dueño legitimo de una cuenta con 2FA viaja a Canada con un telefono nuevo y pasa el segundo factor',
    espera: 'desafio inusual -> TOTP correcto -> 200 con dispositivo nuevo CONFIRMADO y Canada recordado; la siguiente entrada con ese dispositivo ya no es inusual',
    ejecutar: async () => {
      const { secret, userId } = await createAdmin(t, 'viajera@correo.com', true);
      const casa = { ip: '190.70.70.70', country: 'VE' };
      const primera = await login('viajera@correo.com', casa);
      await pedir('post', '/api/auth/login/2fa', casa, { challengeToken: primera.body.challengeToken, code: totp(secret, -30) });

      const hotel = { ip: '45.70.70.70', country: 'CA', ua: UA_MOVIL };
      const desafio = await login('viajera@correo.com', hotel);
      const pasa = await pedir('post', '/api/auth/login/2fa', hotel, { challengeToken: desafio.body.challengeToken, code: totp(secret, 0) });
      const deviceNuevo = cookieDe(pasa, 'device_token');

      const otraVez = await login('viajera@correo.com', { ...hotel, device: deviceNuevo });
      return {
        desafioInusual: desafio.body.unusual,
        pasa: pasa.status,
        deviceNuevo,
        dispositivos: await t.prisma.trustedDevice.findMany({ where: { userId } }),
        paises: (await t.prisma.loginFootprint.findMany({ where: { userId, kind: 'COUNTRY' } })).map((h) => h.value).sort(),
        otraVezInusual: otraVez.body.unusual,
        confirmado: (await eventos(userId, 'risk.stepup.passed')).length,
      };
    },
    verificar: ({ desafioInusual, pasa, deviceNuevo, dispositivos, paises, otraVezInusual, confirmado }) => {
      expect(desafioInusual).toBe(true);
      expect(pasa).toBe(200);
      expect(deviceNuevo).toEqual(expect.any(String));
      expect(dispositivos.filter((d) => d.confirmedAt)).toHaveLength(2); // el de casa y el telefono
      expect(paises).toEqual(['CA', 'VE']);
      expect(otraVezInusual).toBe(false);
      expect(confirmado).toBe(1);
    },
    describirObtenido: ({ desafioInusual, otraVezInusual, paises }) => `1a vez inusual=${desafioInusual}, con el dispositivo confirmado inusual=${otraVezInusual}; paises ${paises.join('+')}`,
  });

  // ---------------- Panel admin ----------------

  describeCase('riesgo de login (e2e)', {
    que: 'el admin abre el mapa del riesgo; un usuario normal no',
    espera: 'admin 200 con modo enforce, umbrales 30/60 y 6 senales; usuario 403',
    ejecutar: async () => {
      const { secret } = await createAdmin(t, 'jefe@correo.com', true);
      const token = await loginAdmin(t, 'jefe@correo.com', secret);
      return {
        admin: await pedir('get', '/api/admin/security/access-risk', { ip: '190.80.80.80' }, undefined, token),
        usuario: (await pedir('get', '/api/admin/security/access-risk', { ip: '190.81.81.81' }, undefined, ana.token)).status,
      };
    },
    verificar: ({ admin, usuario }) => {
      expect(admin.status).toBe(200);
      expect(admin.body).toMatchObject({ mode: 'enforce', thresholds: { mediumFrom: 30, highFrom: 60 } });
      expect(admin.body.signals.map((s: { id: string }) => s.id).sort()).toEqual(
        ['confirmed-device', 'impossible-travel', 'new-country', 'new-network', 'recent-failures', 'unconfirmed-device'],
      );
      expect(usuario).toBe(403);
    },
  });
});

describe('Riesgo de inicio de sesion: modo monitor (e2e)', () => {
  let restaurarEnv: Array<() => void> = [];

  beforeAll(async () => {
    restaurarEnv = [overrideEnv('RISK_MODE', 'monitor'), overrideEnv('TRUST_PROXY', 'true')];
    t = await createTestApp();
  });
  afterAll(async () => {
    restaurarEnv.forEach((restaurar) => restaurar());
    await t.close();
  });

  describeCase('riesgo de login monitor (e2e)', {
    que: 'en monitor el mismo ataque NO se estorba: solo se mide y se audita',
    espera: '200 con sesion; auditado risk.assessed ALTO (outcome allowed); Francia NO se recuerda; el dispositivo queda sin confirmar',
    ejecutar: async () => {
      await crearCuenta('carla@correo.com', CASA);
      const carla = await userByEmail(t, 'carla@correo.com');
      const res = await login('carla@correo.com', ATACANTE);
      return {
        res,
        aviso: (await eventos(carla.id, 'risk.assessed'))[0],
        paises: (await t.prisma.loginFootprint.findMany({ where: { userId: carla.id, kind: 'COUNTRY' } })).map((h) => h.value),
        dispositivos: await t.prisma.trustedDevice.findMany({ where: { userId: carla.id }, orderBy: { firstSeenAt: 'asc' } }),
      };
    },
    verificar: ({ res, aviso, paises, dispositivos }) => {
      expect(res.status).toBe(200);
      expect(res.body.accessToken).toEqual(expect.any(String));
      expect(aviso.metadata).toMatchObject({ level: 'HIGH', country: 'FR', outcome: 'allowed', mode: 'monitor' });
      expect(paises).toEqual(['VE']);
      expect(dispositivos).toHaveLength(2);
      expect(dispositivos[1].confirmedAt).toBeNull();
    },
    describirObtenido: ({ res, aviso }) => `${res.status}; ${meta(aviso).level} ${meta(aviso).outcome}`,
  });

  describeCase('riesgo de login monitor (e2e)', {
    que: 'en monitor un refresh sin el dispositivo de la sesion tampoco se revoca',
    espera: '200 (solo queda auditado risk.session.revoked con revoked=false)',
    ejecutar: async () => {
      const carla = await userByEmail(t, 'carla@correo.com');
      const entrada = await login('carla@correo.com', CASA);
      const res = await pedir('post', '/api/auth/refresh', { ...CASA, refresh: cookieDe(entrada, 'refresh_token') }, {});
      return { res, evento: await esperar(() => eventos(carla.id, 'risk.session.revoked'), (f) => f.length > 0) };
    },
    verificar: ({ res, evento }) => {
      expect(res.status).toBe(200);
      expect(evento[0].metadata).toMatchObject({ reason: 'device-mismatch', revoked: false });
    },
  });
});
