import { describe, expect, it } from 'vitest';
import type { Enrollment, PublicUser } from '@/lib/api-types';
import { mustEnrollNow, routeAfterAuth, safeNext } from '../services/auth-routing';

const user = (roles: PublicUser['roles']): PublicUser => ({
  id: '1',
  email: 'a@b.co',
  name: 'Ana',
  phone: null,
  avatarUrl: null,
  roles,
  emailVerified: true,
  twoFactorEnabled: false,
  hasPassword: true,
});

const enrollment = (patch: Partial<Enrollment>): Enrollment => ({
  mode: 'enforce',
  required: false,
  hasFactor: false,
  mustEnrollNow: false,
  graceEndsAt: null,
  recommended: false,
  blocked: false,
  ...patch,
});

describe('safeNext', () => {
  it('solo acepta rutas internas', () => {
    expect(safeNext('/panel')).toBe('/panel');
    expect(safeNext('//evil.com')).toBeNull();
    expect(safeNext('https://evil.com')).toBeNull();
    // Algunos navegadores tratan "/\" como "//": tambien se rechaza.
    expect(safeNext(String.raw`/\evil.com`)).toBeNull();
    expect(safeNext(undefined)).toBeNull();
  });
});

describe('mustEnrollNow', () => {
  it('en modo monitor solo se avisa, no se bloquea', () => {
    expect(mustEnrollNow({ enrollment: enrollment({ mode: 'monitor', mustEnrollNow: true }) })).toBe(false);
  });
  it('bloquea cuando el servidor limita la cuenta o vencio el plazo en modo estricto', () => {
    expect(mustEnrollNow({ enrollment: enrollment({ blocked: true }) })).toBe(true);
    expect(mustEnrollNow({ enrollment: enrollment({ mustEnrollNow: true }) })).toBe(true);
  });
});

describe('routeAfterAuth', () => {
  it('lleva a proteger la cuenta antes que a cualquier otro sitio', () => {
    const session = { user: user(['OWNER']), enrollment: enrollment({ blocked: true }) };
    expect(routeAfterAuth(session, '/panel')).toBe('/seguridad/activar');
  });
  it('respeta `next` y, si no hay, va al inicio de su rol', () => {
    const ok = enrollment({});
    expect(routeAfterAuth({ user: user(['CLIENT']), enrollment: ok }, '/propiedad/1')).toBe('/propiedad/1');
    expect(routeAfterAuth({ user: user(['CLIENT']), enrollment: ok })).toBe('/mapa');
    expect(routeAfterAuth({ user: user(['AGENCY']), enrollment: ok })).toBe('/panel');
    expect(routeAfterAuth({ user: user(['ADMIN']), enrollment: ok })).toBe('/admin');
  });
});
