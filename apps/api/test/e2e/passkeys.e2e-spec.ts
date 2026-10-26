import { auditLogs, createAdmin, jwtPayload, userByEmail } from '../support/auth-helpers';
import { describeCase } from '../support/describe-case';
import { overrideEnv } from '../support/env-helpers';
import { FakeAuthenticator, type FakeAlgorithm, type Tweak } from '../support/fake-authenticator';
import { ATACANTE, cookieDe, esperar, lugares, meta, type Lugar } from '../support/lugares';
import { createTestApp, PASSWORD, type TestApp } from '../support/test-app';

/**
 * Passkeys (huella, Face ID, Windows Hello) de punta a punta. Un autenticador de software hace lo que haria el
 * dispositivo. Corre en modo enforce y con TRUST_PROXY=true para simular lugares con cabeceras del CDN.
 */
let t: TestApp;
const { pedir, crearCuenta, login, eventos, userId } = lugares(() => t);

/** Un lugar distinto por prueba (la IP cambia) para no chocar con el limite de 10 peticiones por minuto de las rutas publicas. */
const lugar = (n: number, extra: Partial<Lugar> = {}): Lugar => ({ ip: `190.${n}.${n}.${n}`, country: 'VE', ...extra });

const autenticador = (alg: FakeAlgorithm = 'ES256', synced = false) =>
  new FakeAuthenticator({ alg, rpId: 'localhost', origin: 'http://localhost:3000', synced });

const PK = '/api/auth/passkeys';

/** Registra una passkey completa (opciones -> el dispositivo crea -> verificar). */
async function registrarPasskey(auth: FakeAuthenticator, donde: Lugar, token: string, label?: string, password: string | undefined = PASSWORD) {
  const opciones = await pedir('post', `${PK}/register/options`, donde, { password }, token);
  if (opciones.status !== 200) return { opciones, verificar: opciones };
  auth.userHandle = Buffer.from(opciones.body.user.id, 'base64url');
  const credential = auth.create({ challenge: opciones.body.challenge });
  const verificar = await pedir('post', `${PK}/register/verify`, donde, { credential, label }, token);
  return { opciones, verificar, credential };
}

/** Entrar con la passkey, sin correo ni clave. */
async function entrarConPasskey(auth: FakeAuthenticator, donde: Lugar, tweak?: Tweak) {
  const opciones = await pedir('post', `${PK}/login/options`, donde, {});
  const res = await pedir('post', `${PK}/login/verify`, donde, { credential: auth.get({ challenge: opciones.body.challenge }, tweak) });
  return { opciones, res };
}

describe('Passkeys: modo enforce (e2e)', () => {
  let restaurarEnv: Array<() => void> = [];
  let ana: { id: string; device: string; token: string };
  const authAna = autenticador();

  beforeAll(async () => {
    restaurarEnv = [overrideEnv('RISK_MODE', 'enforce'), overrideEnv('TRUST_PROXY', 'true')];
    t = await createTestApp();
    const cuenta = await crearCuenta('ana@correo.com', lugar(10));
    ana = { id: await userId('ana@correo.com'), device: cuenta.device as string, token: cuenta.token };
  });
  afterAll(async () => {
    await t.prisma.blockRule.deleteMany();
    restaurarEnv.forEach((restaurar) => restaurar());
    await t.close();
  });

  const anaEn = (extra: Partial<Lugar> = {}) => lugar(10, { device: ana.device, ...extra });

  // ---------------- Registrar ----------------

  describeCase('passkeys (e2e)', {
    que: 'agregar una passkey exige la contrasena otra vez y un dispositivo CONFIRMADO',
    espera: 'sin contrasena o con una mala: 403; desde un navegador sin dispositivo confirmado: 403 TRUSTED_DEVICE_REQUIRED y auditado; desde el dispositivo de siempre con la clave: 200',
    ejecutar: async () => {
      const sinClave = await pedir('post', `${PK}/register/options`, anaEn(), {}, ana.token);
      const claveMala = await pedir('post', `${PK}/register/options`, anaEn(), { password: 'Otra12345' }, ana.token);
      const sinDispositivo = await pedir('post', `${PK}/register/options`, lugar(10), { password: PASSWORD }, ana.token);
      const bien = await pedir('post', `${PK}/register/options`, anaEn(), { password: PASSWORD }, ana.token);
      return { sinClave, claveMala, sinDispositivo, bien, denegado: await eventos(ana.id, 'risk.factor.denied') };
    },
    verificar: ({ sinClave, claveMala, sinDispositivo, bien, denegado }) => {
      expect(sinClave.status).toBe(403);
      expect(claveMala.status).toBe(403);
      expect(sinDispositivo.status).toBe(403);
      expect(sinDispositivo.body.code).toBe('TRUSTED_DEVICE_REQUIRED');
      expect(bien.status).toBe(200);
      expect(denegado.length).toBeGreaterThanOrEqual(1);
    },
    describirObtenido: ({ sinClave, claveMala, sinDispositivo, bien }) => `${sinClave.status}/${claveMala.status}/${sinDispositivo.status}(${sinDispositivo.body.code})/${bien.status}`,
  });

  describeCase('passkeys (e2e)', {
    que: 'registro completo: el dispositivo crea la passkey y el servidor guarda solo la clave PUBLICA',
    espera: 'opciones con verificacion obligatoria y passkey descubrible; 201; la base guarda clave publica y contador; auditado; el listado no expone secretos; repetir la respuesta o la misma passkey falla',
    ejecutar: async () => {
      const { opciones, verificar, credential } = await registrarPasskey(authAna, anaEn(), ana.token, 'Mi laptop');
      const fila = await t.prisma.passkeyCredential.findFirstOrThrow({ where: { userId: ana.id } });
      const lista = await pedir('get', PK, anaEn(), undefined, ana.token);
      const repetida = await pedir('post', `${PK}/register/verify`, anaEn(), { credential }, ana.token);
      const misma = await registrarPasskey(authAna, anaEn(), ana.token, 'Otra vez');
      return { opciones, verificar, fila, lista, repetida, misma, evento: await eventos(ana.id, 'risk.passkey.registered') };
    },
    verificar: ({ opciones, verificar, fila, lista, repetida, misma, evento }) => {
      expect(opciones.body).toMatchObject({
        rp: { id: 'localhost' },
        attestation: 'none',
        authenticatorSelection: { residentKey: 'required', userVerification: 'required' },
        excludeCredentials: [],
      });
      expect(opciones.body.pubKeyCredParams.map((p: { alg: number }) => p.alg)).toEqual([-7, -257, -8]);
      expect(Buffer.from(opciones.body.user.id, 'base64url')).toHaveLength(32);
      expect(opciones.body.user.id).not.toContain(ana.id); // el userHandle es opaco, no el id real
      expect(verificar.status).toBe(201);
      expect(fila).toMatchObject({ credentialId: authAna.id, algorithm: -7, label: 'Mi laptop', backedUp: false });
      expect(fila.signCount).toBe(1n);
      expect(fila.publicKey).toBe(authAna.coseKey().toString('base64url'));
      expect(lista.body.items).toHaveLength(1);
      expect(JSON.stringify(lista.body)).not.toContain(fila.publicKey);
      expect(JSON.stringify(lista.body)).not.toContain(authAna.id);
      expect(repetida.status).toBe(400); // el desafio ya se uso
      expect(misma.opciones.body.excludeCredentials).toEqual([{ type: 'public-key', id: authAna.id }]);
      expect(misma.verificar.status).toBe(409);
      expect(evento).toHaveLength(1);
    },
    describirObtenido: ({ verificar, repetida, misma }) => `registro ${verificar.status}; repetir respuesta ${repetida.status}; misma passkey ${misma.verificar.status}`,
  });

  // ---------------- Entrar con passkey ----------------

  describeCase('passkeys (e2e)', {
    que: 'entrar con passkey desde un telefono nuevo en otro pais (todo "raro"), sin correo ni contrasena',
    espera: '200 con sesion verificada con segundo factor (claim twoFactor); el dispositivo nuevo queda CONFIRMADO y Francia recordada; auditado risk.stepup.passed',
    ejecutar: async () => {
      const donde = lugar(30, { country: 'FR', ua: ATACANTE.ua });
      const { opciones, res } = await entrarConPasskey(authAna, donde);
      const sesion = await t.prisma.session.findFirst({ where: { userId: ana.id }, orderBy: { createdAt: 'desc' } });
      return {
        opciones,
        res,
        claims: jwtPayload(res.body.accessToken ?? 'a.e30.b'),
        sesion,
        dispositivo: (await t.prisma.trustedDevice.findMany({ where: { userId: ana.id } })).find((d) => d.label === 'Safari en iOS'),
        paises: (await t.prisma.loginFootprint.findMany({ where: { userId: ana.id, kind: 'COUNTRY' } })).map((h) => h.value).sort(),
        pasado: await eventos(ana.id, 'risk.stepup.passed'),
      };
    },
    verificar: ({ opciones, res, claims, sesion, dispositivo, paises, pasado }) => {
      expect(opciones.body).toMatchObject({ rpId: 'localhost', userVerification: 'required', allowCredentials: [] });
      expect(res.status).toBe(200);
      expect(res.body.twoFactorRequired).toBeUndefined();
      expect(claims.twoFactor).toBe(true);
      expect(sesion?.twoFactorVerified).toBe(true);
      expect(cookieDe(res, 'device_token')).toEqual(expect.any(String));
      expect(dispositivo?.confirmedAt).toBeTruthy();
      expect(paises).toEqual(['FR', 'VE']);
      expect(pasado).toHaveLength(1);
    },
    describirObtenido: ({ res, claims, paises }) => `${res.status}; twoFactor=${claims.twoFactor}; paises ${paises.join('+')}`,
  });

  describeCase('passkeys (e2e)', {
    que: 'intentos de entrar con una passkey manipulada o ajena',
    espera: 'todos 401 "Passkey invalida" (el mismo mensaje); el motivo real solo queda en auditoria; repetir una respuesta ya usada tambien falla',
    ejecutar: async () => {
      const otra = autenticador(); // nunca registrada
      const casos: Array<[string, FakeAuthenticator, Tweak | undefined, number]> = [
        ['origen', authAna, { origin: 'https://phishing.test' }, 40],
        ['sinVerificar', authAna, { uv: false }, 41],
        ['firma', authAna, { corruptSignature: true }, 42],
        ['otraClave', authAna, { signWith: otra }, 43],
        ['userHandleAjeno', authAna, { userHandle: Buffer.from('otro-usuario') }, 44],
        ['desconocida', otra, undefined, 45],
      ];
      const resultados: Record<string, { status: number; message: string }> = {};
      for (const [nombre, auth, tweak, n] of casos) {
        const { res } = await entrarConPasskey(auth, lugar(n), tweak);
        resultados[nombre] = { status: res.status, message: res.body.message };
      }
      // Una respuesta valida capturada y enviada dos veces: la segunda ya no sirve.
      const donde = lugar(46);
      const opciones = await pedir('post', `${PK}/login/options`, donde, {});
      const credential = authAna.get({ challenge: opciones.body.challenge });
      const primera = await pedir('post', `${PK}/login/verify`, donde, { credential });
      const segunda = await pedir('post', `${PK}/login/verify`, donde, { credential });
      const motivos = (await auditLogs(t, { where: { action: 'risk.passkey.failed' } })).map((e) => meta(e).reason);
      return { resultados, primera: primera.status, segunda: segunda.status, motivos };
    },
    verificar: ({ resultados, primera, segunda, motivos }) => {
      for (const r of Object.values(resultados)) expect(r).toEqual({ status: 401, message: 'Passkey invalida' });
      expect([primera, segunda]).toEqual([200, 401]);
      expect(motivos).toEqual(expect.arrayContaining(['bad-origin', 'user-not-verified', 'bad-signature', 'bad-user-handle', 'unknown-credential', 'bad-challenge']));
    },
    describirObtenido: ({ resultados, primera, segunda }) => `${Object.keys(resultados).length} manipulaciones -> 401; replay ${primera}/${segunda}`,
  });

  describeCase('passkeys (e2e)', {
    que: 'una passkey con el contador atrasado (copia clonada)',
    espera: 'el uso legitimo sube el contador; la copia (contador menor) da 401, la passkey queda revocada y auditada; despues ni el original entra. Una passkey sincronizada con contador 0 NO se toma por clon',
    ejecutar: async () => {
      const clon = autenticador();
      await registrarPasskey(clon, anaEn(), ana.token, 'Con copia');
      const legitimo = await entrarConPasskey(clon, lugar(50)); // contador 2
      const copia = await entrarConPasskey(clon, lugar(51), { signCount: 1 });
      const despues = await entrarConPasskey(clon, lugar(52)); // ya revocada
      const fila = await t.prisma.passkeyCredential.findFirstOrThrow({ where: { credentialId: clon.id } });

      const sincronizada = autenticador('ES256', true);
      await registrarPasskey(sincronizada, anaEn(), ana.token, 'iCloud');
      const usos = [(await entrarConPasskey(sincronizada, lugar(53))).res.status, (await entrarConPasskey(sincronizada, lugar(54))).res.status];
      return { legitimo: legitimo.res.status, copia: copia.res.status, despues: despues.res.status, revocada: fila.revokedAt, evento: await eventos(ana.id, 'risk.passkey.cloned'), usos };
    },
    verificar: ({ legitimo, copia, despues, revocada, evento, usos }) => {
      expect([legitimo, copia, despues]).toEqual([200, 401, 401]);
      expect(revocada).toBeTruthy();
      expect(evento).toHaveLength(1);
      expect(usos).toEqual([200, 200]);
    },
    describirObtenido: ({ legitimo, copia, despues, usos }) => `legitimo ${legitimo}, copia ${copia}, despues ${despues}; sincronizada ${usos.join('/')}`,
  });

  // ---------------- Passkey como segundo factor ----------------

  describeCase('passkeys (e2e)', {
    que: 'un admin SIN app autenticadora, solo con passkey, abre el panel (la passkey cuenta como 2FA)',
    espera: 'con clave sola el panel da 403 TWO_FACTOR_REQUIRED; tras entrar con passkey da 200',
    ejecutar: async () => {
      await createAdmin(t, 'jefe@correo.com', false);
      const casa = lugar(60);
      const base = await login('jefe@correo.com', casa);
      const device = cookieDe(base, 'device_token') as string;
      const conClave = await pedir('get', '/api/admin/security/threat-model', { ...casa, device }, undefined, base.body.accessToken);

      const auth = autenticador('RS256'); // el algoritmo que usa Windows Hello
      const registro = await registrarPasskey(auth, { ...casa, device }, base.body.accessToken, 'Windows Hello');
      const { res } = await entrarConPasskey(auth, lugar(61));
      const conPasskey = await pedir('get', '/api/admin/security/threat-model', lugar(61), undefined, res.body.accessToken);
      return { conClave, registro: registro.verificar.status, entrada: res.status, conPasskey };
    },
    verificar: ({ conClave, registro, entrada, conPasskey }) => {
      expect(conClave.status).toBe(403);
      expect(conClave.body.code).toBe('TWO_FACTOR_REQUIRED');
      expect(registro).toBe(201);
      expect(entrada).toBe(200);
      expect(conPasskey.status).toBe(200);
    },
    describirObtenido: ({ conClave, conPasskey }) => `clave sola ${conClave.status} ${conClave.body.code}; con passkey ${conPasskey.status}`,
  });

  describeCase('passkeys (e2e)', {
    que: 'un inicio de sesion muy raro de una cuenta con passkey (y sin 2FA): ya NO se niega, se pide la passkey',
    espera: 'desafio con unusual=true y methods ["passkey"] (sin correo); con la passkey correcta entra; la passkey de OTRO usuario no sirve con este desafio',
    ejecutar: async () => {
      const bea = await crearCuenta('bea@correo.com', lugar(70));
      const authBea = autenticador();
      await registrarPasskey(authBea, lugar(70, { device: bea.device }), bea.token, 'Bea');
      const raro = lugar(71, { country: 'CA', ua: ATACANTE.ua });
      const desafio = await login('bea@correo.com', raro);
      const porCorreo = await pedir('post', '/api/auth/login/2fa/email-code', raro, { challengeToken: desafio.body.challengeToken });

      // Con la passkey de otra persona (ana) y el desafio de Bea: no sirve.
      const optsAjena = await pedir('post', `${PK}/step-up/options`, raro, { challengeToken: desafio.body.challengeToken });
      const ajena = await pedir('post', `${PK}/step-up/verify`, raro, { challengeToken: desafio.body.challengeToken, credential: authAna.get({ challenge: optsAjena.body.challenge }) });

      const opts = await pedir('post', `${PK}/step-up/options`, raro, { challengeToken: desafio.body.challengeToken });
      const buena = await pedir('post', `${PK}/step-up/verify`, raro, { challengeToken: desafio.body.challengeToken, credential: authBea.get({ challenge: opts.body.challenge }) });
      return { desafio, porCorreo, optsAjena, ajena, opts, buena, id: await userId('bea@correo.com'), authBea };
    },
    verificar: ({ desafio, porCorreo, ajena, opts, buena, authBea }) => {
      expect(desafio.status).toBe(200);
      expect(desafio.body).toMatchObject({ twoFactorRequired: true, unusual: true, methods: ['passkey'] });
      expect(desafio.body.accessToken).toBeUndefined();
      expect(porCorreo.status).toBe(403);
      expect(ajena.status).toBe(401);
      expect(opts.body.allowCredentials).toEqual([{ type: 'public-key', id: authBea.id }]);
      expect(buena.status).toBe(200);
      expect(buena.body.accessToken).toEqual(expect.any(String));
      expect(cookieDe(buena, 'device_token')).toEqual(expect.any(String));
    },
    describirObtenido: ({ desafio, ajena, buena }) => `metodos ${JSON.stringify(desafio.body.methods)}; passkey ajena ${ajena.status}; propia ${buena.status}`,
  });

  describeCase('passkeys (e2e)', {
    que: 'el atacante falla la passkey 3 veces en el segundo paso',
    espera: 'igual que con el TOTP: cuenta bloqueada 30 min y auditada; despues ni la passkey correcta entra por esa via',
    ejecutar: async () => {
      const cora = await crearCuenta('cora@correo.com', lugar(80));
      const authCora = autenticador();
      await registrarPasskey(authCora, lugar(80, { device: cora.device }), cora.token, 'Cora');
      const raro = lugar(81, { country: 'DE', ua: ATACANTE.ua });
      const desafio = await login('cora@correo.com', raro);
      const intentos: number[] = [];
      for (let i = 0; i < 3; i++) {
        const opts = await pedir('post', `${PK}/step-up/options`, raro, { challengeToken: desafio.body.challengeToken });
        const credential = authCora.get({ challenge: opts.body.challenge }, { corruptSignature: true });
        intentos.push((await pedir('post', `${PK}/step-up/verify`, raro, { challengeToken: desafio.body.challengeToken, credential })).status);
      }
      const opts = await pedir('post', `${PK}/step-up/options`, raro, { challengeToken: desafio.body.challengeToken });
      const valida = await pedir('post', `${PK}/step-up/verify`, raro, { challengeToken: desafio.body.challengeToken, credential: authCora.get({ challenge: opts.body.challenge }) });
      const id = await userId('cora@correo.com');
      const usuario = await userByEmail(t, 'cora@correo.com');
      return { intentos, valida: valida.status, bloqueo: await esperar(() => eventos(id, 'risk.account.locked'), (f) => f.length > 0), lockedUntil: usuario.lockedUntil };
    },
    verificar: ({ intentos, valida, bloqueo, lockedUntil }) => {
      expect(intentos).toEqual([401, 401, 401]);
      expect(bloqueo).toHaveLength(1);
      expect(lockedUntil!.getTime()).toBeGreaterThan(Date.now() + 25 * 60_000);
      expect(valida).toBe(403);
    },
    describirObtenido: ({ intentos, valida }) => `${intentos.join(',')}; passkey correcta despues del bloqueo: ${valida}`,
  });

  // ---------------- Otros metodos de verificacion y gestion ----------------

  describeCase('passkeys (e2e)', {
    que: 'activar el 2FA con app autenticadora tambien exige un dispositivo confirmado',
    espera: 'desde un navegador sin dispositivo confirmado 403 TRUSTED_DEVICE_REQUIRED; desde el dispositivo de siempre 200',
    ejecutar: async () => {
      const dan = await crearCuenta('dan@correo.com', lugar(90));
      return {
        sin: await pedir('post', '/api/auth/2fa/setup', lugar(90), {}, dan.token),
        con: await pedir('post', '/api/auth/2fa/setup', lugar(90, { device: dan.device }), {}, dan.token),
      };
    },
    verificar: ({ sin, con }) => {
      expect(sin.status).toBe(403);
      expect(sin.body.code).toBe('TRUSTED_DEVICE_REQUIRED');
      expect(con.status).toBe(200);
    },
  });

  describeCase('passkeys (e2e)', {
    que: 'gestionar passkeys: renombrar, quitar la propia, y que las ajenas "no existan"',
    espera: 'renombrar 200; otro usuario 404 al renombrar o quitar; quitar sin dispositivo confirmado 403; quitar la propia 204 y auditado; con una quitada ya no se entra',
    ejecutar: async () => {
      const eva = await crearCuenta('eva@correo.com', lugar(100));
      const authEva = autenticador();
      const evaLugar = lugar(100, { device: eva.device });
      await registrarPasskey(authEva, evaLugar, eva.token, 'Eva');
      const fila = await t.prisma.passkeyCredential.findFirstOrThrow({ where: { credentialId: authEva.id } });
      const intruso = await crearCuenta('fer@correo.com', lugar(101));
      const intrusoLugar = lugar(101, { device: intruso.device });

      const renombrar = await pedir('patch', `${PK}/${fila.id}`, evaLugar, { label: 'Mi telefono' }, eva.token);
      const ajenaRenombrar = await pedir('patch', `${PK}/${fila.id}`, intrusoLugar, { label: 'hackeada' }, intruso.token);
      const ajenaQuitar = await pedir('delete', `${PK}/${fila.id}`, intrusoLugar, undefined, intruso.token);
      const sinDispositivo = await pedir('delete', `${PK}/${fila.id}`, lugar(100), undefined, eva.token);
      const quitar = await pedir('delete', `${PK}/${fila.id}`, evaLugar, undefined, eva.token);
      const entrar = await entrarConPasskey(authEva, lugar(102));
      return { renombrar, ajenaRenombrar: ajenaRenombrar.status, ajenaQuitar: ajenaQuitar.status, sinDispositivo: sinDispositivo.status, quitar: quitar.status, entrar: entrar.res.status, evento: await eventos(await userId('eva@correo.com'), 'risk.passkey.revoked') };
    },
    verificar: ({ renombrar, ajenaRenombrar, ajenaQuitar, sinDispositivo, quitar, entrar, evento }) => {
      expect(renombrar.status).toBe(200);
      expect(renombrar.body.label).toBe('Mi telefono');
      expect([ajenaRenombrar, ajenaQuitar]).toEqual([404, 404]);
      expect(sinDispositivo).toBe(403);
      expect(quitar).toBe(204);
      expect(entrar).toBe(401);
      expect(evento).toHaveLength(1);
    },
    describirObtenido: ({ ajenaRenombrar, ajenaQuitar, sinDispositivo, quitar, entrar }) => `ajena ${ajenaRenombrar}/${ajenaQuitar}; sin dispositivo ${sinDispositivo}; propia ${quitar}; entrar ${entrar}`,
  });

  describeCase('passkeys (e2e)', {
    que: 'el cuerpo se valida estricto: campos que no existen, ids que no son base64url y tipos falsos',
    espera: '400 en todos (nunca llegan al verificador)',
    ejecutar: async () => {
      const opciones = await pedir('post', `${PK}/login/options`, lugar(110), {});
      const buena = authAna.get({ challenge: opciones.body.challenge });
      const enviar = (credential: unknown, n: number) => pedir('post', `${PK}/login/verify`, lugar(n), { credential }).then((r) => r.status);
      return {
        campoExtra: await enviar({ ...buena, role: 'ADMIN' }, 111),
        idRaro: await enviar({ ...buena, id: 'a+b/c==', rawId: 'a+b/c==' }, 112),
        tipoFalso: await enviar({ ...buena, type: 'password' }, 113),
        sinRespuesta: await enviar({ id: buena.id, rawId: buena.rawId, type: 'public-key' }, 114),
        respuestaConExtra: await enviar({ ...buena, response: { ...buena.response, admin: true } }, 115),
        enorme: await enviar({ ...buena, response: { ...buena.response, signature: 'A'.repeat(5000) } }, 116),
      };
    },
    verificar: (r) => expect(Object.values(r).every((status) => status === 400)).toBe(true),
    describirObtenido: (r) => JSON.stringify(r),
  });
});

describe('Passkeys: modo monitor (e2e)', () => {
  let restaurarEnv: Array<() => void> = [];

  beforeAll(async () => {
    restaurarEnv = [overrideEnv('RISK_MODE', 'monitor'), overrideEnv('TRUST_PROXY', 'true')];
    t = await createTestApp();
  });
  afterAll(async () => {
    restaurarEnv.forEach((restaurar) => restaurar());
    await t.close();
  });

  describeCase('passkeys monitor (e2e)', {
    que: 'en monitor agregar una passkey NO exige dispositivo confirmado (solo la contrasena)',
    espera: '200 aun sin la cookie del dispositivo',
    ejecutar: async () => {
      const gus = await crearCuenta('gus@correo.com', lugar(120));
      return pedir('post', `${PK}/register/options`, lugar(120), { password: PASSWORD }, gus.token);
    },
    verificar: (res) => expect(res.status).toBe(200),
  });
});
