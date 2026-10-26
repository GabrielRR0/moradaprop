import type { Prisma } from '@prisma/client';
import { FieldCipher, UserVault } from '../../src/modules/security';
import { hashPassword } from '../../src/common/password';
import { authenticator } from 'otplib';
import { PASSWORD, totp, type TestApp } from './test-app';

/** Registra un usuario y lo verifica por la API (como lo haria la web). Devuelve su token y su id. */
export async function registerVerified(t: TestApp, email: string, accountType = 'CLIENT', agencyName?: string) {
  await t
    .web('post')('/api/auth/register')
    .send({ email, password: PASSWORD, name: 'Usuario Prueba', accountType, ...(agencyName ? { agencyName } : {}) });
  const code = t.mail.lastCode(email, 'verify-email');
  const res = await t.web('post')('/api/auth/verify-email').send({ email, code });
  const user = await userByEmail(t, email);
  return {
    userId: user.id,
    accessToken: res.body.accessToken as string,
    refreshCookie: ((res.headers['set-cookie'] as unknown as string[])[0] ?? '').split(';')[0],
  };
}

/** Crea un administrador directo en la base (los admin nunca se crean por la API publica). */
export async function createAdmin(t: TestApp, email: string, withTwoFactor: boolean) {
  const secret = authenticator.generateSecret();
  const vault = t.app.get(UserVault);
  const user = await t.prisma.user.create({
    data: {
      ...vault.encode({ email, name: 'Admin Prueba' }),
      roles: ['CLIENT', 'ADMIN'],
      passwordHash: await hashPassword(PASSWORD),
      emailVerifiedAt: new Date(),
      twoFactorEnabled: withTwoFactor,
      twoFactorSecret: withTwoFactor ? t.app.get(FieldCipher).encrypt('User.twoFactorSecret', secret) : null,
    },
  });
  return { userId: user.id, secret };
}

/** Login completo de un admin (con 2FA si lo tiene). Devuelve el access token. */
export async function loginAdmin(t: TestApp, email: string, secret?: string, offsetSeconds = 0) {
  const login = await t.web('post')('/api/auth/login').send({ email, password: PASSWORD });
  if (!login.body.twoFactorRequired) return login.body.accessToken as string;
  const second = await t
    .web('post')('/api/auth/login/2fa')
    .send({ challengeToken: login.body.challengeToken, code: totp(secret as string, offsetSeconds) });
  return second.body.accessToken as string;
}

/** Lee el payload de un JWT sin verificar la firma (solo para inspeccionar claims en los tests). */
export const jwtPayload = (token: string) => JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString());

/** Inicia sesion (sin 2FA) y devuelve el access token. Sirve para refrescar roles tras cambiarlos en la base. */
export async function loginUser(t: TestApp, email: string) {
  const res = await t.web('post')('/api/auth/login').send({ email, password: PASSWORD });
  return res.body.accessToken as string;
}

/** Usuario por correo, ya descifrado (en la base el correo esta cifrado: se busca por emailHash). */
export async function userByEmail<A extends Omit<Prisma.UserFindUniqueOrThrowArgs, 'where'> = object>(
  t: TestApp,
  email: string,
  args?: A,
) {
  const vault = t.app.get(UserVault);
  const row = await t.prisma.user.findUniqueOrThrow({ ...(args as A), where: { emailHash: vault.emailHash(email) } });
  return vault.decode(row as Prisma.UserGetPayload<A>);
}

/** Crea un usuario directo en la base con sus datos personales cifrados. */
export function createUserRow(t: TestApp, data: { email: string; name: string; phone?: string | null } & Omit<Prisma.UserCreateInput, 'email' | 'emailHash' | 'name' | 'phone' | 'searchTokens'>) {
  const { email, name, phone, ...rest } = data;
  return t.prisma.user.create({ data: { ...t.app.get(UserVault).encode({ email, name, phone }), ...rest } });
}
