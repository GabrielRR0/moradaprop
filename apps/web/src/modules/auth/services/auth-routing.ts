import type { AuthSession, Role } from '@/lib/api-types';

/** El servidor aun no exige el segundo factor si esta en modo monitor: ahi solo se avisa. */
export function mustEnrollNow(session: Pick<AuthSession, 'enrollment'>): boolean {
  const e = session.enrollment;
  return Boolean(e && (e.blocked || (e.mustEnrollNow && e.mode !== 'monitor')));
}

/** Solo rutas internas: evita que `?next=` mande al usuario a otro sitio. */
export function safeNext(next: string | undefined | null): string | null {
  if (!next || !next.startsWith('/') || next.startsWith('//') || next.includes('\\')) return null;
  return next;
}

const HOME_BY_ROLE: Array<[Role, string]> = [
  ['ADMIN', '/admin'],
  ['AGENCY', '/panel'],
  ['OWNER', '/publicar'],
];

/** A donde llevar al usuario justo despues de entrar. */
export function routeAfterAuth(session: Pick<AuthSession, 'user' | 'enrollment'>, next?: string | null): string {
  if (mustEnrollNow(session)) return '/seguridad/activar';
  const target = safeNext(next);
  if (target) return target;
  const home = HOME_BY_ROLE.find(([role]) => session.user.roles.includes(role));
  return home ? home[1] : '/mapa';
}
