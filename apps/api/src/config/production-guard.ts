import type { z } from 'zod';
import type { envSchema } from './env.schema';

type RawEnv = z.infer<typeof envSchema>;

/** Secretos que deben ser largos en produccion. */
const MIN_SECRET_LENGTH = 32;

/** Una clave "de ejemplo": viene escrita en el repositorio, asi que cualquiera la conoce. */
const looksLikeDevValue = (value: string) => /change-?me|^dev-|^test-|example|secret-0123/i.test(value);

/**
 * En produccion el servidor SE NIEGA A ARRANCAR si quedo alguna clave o ajuste de desarrollo.
 * Las claves de desarrollo estan publicas en el repositorio (docker-compose.yml, .env.example):
 * usarlas en produccion permitiria falsificar sesiones y descifrar los secretos del 2FA.
 *
 * Devuelve la lista de problemas (vacia = todo bien).
 */
export function productionProblems(env: RawEnv): string[] {
  if (env.NODE_ENV !== 'production') return [];
  const problems: string[] = [];

  const secrets: Array<[string, string]> = [
    ['JWT_ACCESS_SECRET', env.JWT_ACCESS_SECRET],
    ['JWT_REFRESH_SECRET', env.JWT_REFRESH_SECRET],
    ['ENCRYPTION_KEY', env.ENCRYPTION_KEY],
  ];
  for (const [name, value] of secrets) {
    if (looksLikeDevValue(value)) problems.push(`${name} es un valor de desarrollo; genera uno aleatorio`);
    if (value.length < MIN_SECRET_LENGTH) problems.push(`${name} debe tener al menos ${MIN_SECRET_LENGTH} caracteres`);
  }
  const versioned = env.ENCRYPTION_KEYS.split(',').map((p) => p.trim()).filter(Boolean);
  const seen = new Set<string>();
  for (const entry of versioned) {
    const [version, ...rest] = entry.split(':');
    const value = rest.join(':');
    if (!version || !value) {
      problems.push(`ENCRYPTION_KEYS tiene una entrada invalida; usa "v1:clave,v2:clave"`);
      continue;
    }
    if (looksLikeDevValue(value)) problems.push(`ENCRYPTION_KEYS (${version}) es un valor de desarrollo; genera uno aleatorio`);
    if (value.length < MIN_SECRET_LENGTH) problems.push(`ENCRYPTION_KEYS (${version}) debe tener al menos ${MIN_SECRET_LENGTH} caracteres`);
    if (seen.has(value)) problems.push('ENCRYPTION_KEYS no puede repetir la misma clave en dos versiones');
    seen.add(value);
  }
  if (env.JWT_ACCESS_SECRET === env.JWT_REFRESH_SECRET) {
    problems.push('JWT_ACCESS_SECRET y JWT_REFRESH_SECRET deben ser distintos');
  }

  const clientKeys: Array<[string, string]> = [
    ['APP_CLIENT_KEY_WEB', env.APP_CLIENT_KEY_WEB],
    ['APP_CLIENT_KEY_MOBILE', env.APP_CLIENT_KEY_MOBILE],
  ];
  for (const [name, value] of clientKeys) {
    if (looksLikeDevValue(value)) problems.push(`${name} es un valor de desarrollo; define uno propio`);
  }

  if (/localhost|127\.0\.0\.1/.test(env.CORS_ALLOWED_ORIGINS)) {
    problems.push('CORS_ALLOWED_ORIGINS apunta a localhost; define el dominio real de la web');
  }
  return problems;
}

export function assertProductionSafe(env: RawEnv): void {
  const problems = productionProblems(env);
  if (problems.length > 0) {
    throw new Error(`Configuracion insegura para produccion:\n${problems.map((p) => `  - ${p}`).join('\n')}`);
  }
}
