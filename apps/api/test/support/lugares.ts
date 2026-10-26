import type { Response } from 'supertest';
import { auditLogs, userByEmail } from './auth-helpers';
import { PASSWORD, type TestApp } from './test-app';

/**
 * Simula DESDE DONDE entra un usuario, con las cabeceras que pondria un CDN: x-forwarded-for (IP) y cf-ipcountry (pais).
 * Por eso las suites que lo usan corren con TRUST_PROXY=true. Compartido por los e2e de riesgo y de passkeys.
 */
export const UA_PC = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36';
export const UA_MOVIL = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1';

export interface Lugar {
  ip: string;
  country?: string;
  ua?: string;
  /** Secreto del dispositivo (cookie device_token). */
  device?: string;
  /** Refresh token (cookie refresh_token). */
  refresh?: string;
}

export const CASA: Lugar = { ip: '190.10.10.10', country: 'VE' };
export const OTRA_RED_VE: Lugar = { ip: '190.20.20.20', country: 'VE' };
export const VPN_CANADA: Lugar = { ip: '45.30.30.30', country: 'CA' };
export const ATACANTE: Lugar = { ip: '82.40.40.40', country: 'FR', ua: UA_MOVIL };

/** Valor de una cookie del header Set-Cookie. */
export const cookieDe = (res: Response, nombre: string) => {
  const linea = ((res.headers['set-cookie'] as unknown as string[] | undefined) ?? []).find((c) => c.startsWith(`${nombre}=`));
  return linea?.slice(nombre.length + 1).split(';')[0];
};

/** Espera (hasta 3 s) a que se cumpla algo que ocurre despues de responder, como un bloqueo o una auditoria. */
export async function esperar<T>(leer: () => Promise<T>, listo: (valor: T) => boolean = Boolean): Promise<T> {
  let valor = await leer();
  for (let i = 0; i < 30 && !listo(valor); i++) {
    await new Promise((resolve) => setTimeout(resolve, 100));
    valor = await leer();
  }
  return valor;
}

/** Metadata de un evento de auditoria (ya descifrada) como objeto simple. */
export const meta = (evento: { metadata: unknown } | undefined) => (evento?.metadata ?? {}) as Record<string, unknown>;

/** Ayudantes ligados a la app de la suite (se pasa un getter porque la app se crea en beforeAll). */
export function lugares(getApp: () => TestApp) {
  const pedir = (method: 'get' | 'post' | 'patch' | 'delete', url: string, lugar: Lugar, body?: object, bearer?: string) => {
    let req = getApp().web(method)(url).set({
      'x-forwarded-for': lugar.ip,
      'user-agent': lugar.ua ?? UA_PC,
      ...(lugar.country ? { 'cf-ipcountry': lugar.country } : {}),
    });
    const cookies = [lugar.device && `device_token=${lugar.device}`, lugar.refresh && `refresh_token=${lugar.refresh}`].filter(Boolean);
    if (cookies.length > 0) req = req.set('Cookie', cookies.join('; '));
    if (bearer) req = req.set('Authorization', `Bearer ${bearer}`);
    return body === undefined ? req : req.send(body);
  };

  /** Registra y verifica una cuenta desde `lugar`: esa primera entrada es la linea base (dispositivo confirmado). */
  async function crearCuenta(email: string, lugar: Lugar, accountType: 'CLIENT' | 'OWNER' | 'AGENCY' = 'CLIENT') {
    await pedir('post', '/api/auth/register', lugar, { email, password: PASSWORD, name: 'Usuario Riesgo', accountType, ...(accountType === 'AGENCY' ? { agencyName: 'Agencia de Prueba' } : {}) });
    const res = await pedir('post', '/api/auth/verify-email', lugar, { email, code: getApp().mail.lastCode(email, 'verify-email') });
    return { res, device: cookieDe(res, 'device_token'), refresh: cookieDe(res, 'refresh_token'), token: res.body.accessToken as string };
  }

  const login = (email: string, lugar: Lugar) => pedir('post', '/api/auth/login', lugar, { email, password: PASSWORD });
  const eventos = (userId: string, action: string) => auditLogs(getApp(), { where: { userId, action }, orderBy: { createdAt: 'asc' } });
  const userId = async (email: string) => (await userByEmail(getApp(), email)).id;

  return { pedir, crearCuenta, login, eventos, userId };
}
