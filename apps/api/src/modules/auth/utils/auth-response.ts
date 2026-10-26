import type { Response } from 'express';
import { DEVICE_COOKIE } from '../../../common/security/decorators';
import type { AppClient } from '../../../common/security/types';
import type { GoogleLoginResult } from '../services/google-auth.service';
import type { AuthTokens, LoginResult } from './auth-context';

export const REFRESH_COOKIE = 'refresh_token';

export interface CookieSettings {
  secure: boolean;
  maxAgeDays: number;
}

/**
 * Da forma a la respuesta de login:
 *  - web: el refresh token viaja SOLO en cookie httpOnly (el JS de la pagina no puede leerlo).
 *  - mobile: no hay cookies, el refresh token va en el body.
 */
export function respondWithTokens(
  res: Response,
  client: AppClient | undefined,
  tokens: AuthTokens,
  cookie: CookieSettings,
) {
  const { refreshToken, deviceToken, ...body } = tokens;
  if (client === 'mobile') return { ...body, refreshToken, ...(deviceToken ? { deviceToken } : {}) };

  // Dispositivo nuevo (security/access-risk): el navegador guarda el secreto, el servidor solo su hash.
  if (deviceToken) {
    res.cookie(DEVICE_COOKIE, deviceToken, {
      httpOnly: true,
      secure: cookie.secure,
      sameSite: 'lax',
      path: '/api/auth',
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });
  }

  res.cookie(REFRESH_COOKIE, refreshToken, {
    httpOnly: true,
    secure: cookie.secure,
    sameSite: 'lax',
    path: '/api/auth',
    maxAge: cookie.maxAgeDays * 24 * 60 * 60 * 1000,
  });
  return body;
}

export function respondWithLogin(
  res: Response,
  client: AppClient | undefined,
  result: LoginResult | GoogleLoginResult,
  cookie: CookieSettings,
) {
  if ('linkRequired' in result) return result;
  if (result.twoFactorRequired) return result;
  return respondWithTokens(res, client, result.tokens, cookie);
}

export function clearRefreshCookie(res: Response, secure: boolean) {
  res.clearCookie(REFRESH_COOKIE, { httpOnly: true, secure, sameSite: 'lax', path: '/api/auth' });
}
