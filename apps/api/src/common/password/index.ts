import { hash, verify } from 'argon2';

/** Regla de contrasena (la usan los DTO): 8-128 caracteres con al menos una letra y un numero. */
export const PASSWORD_PATTERN = /^(?=.*[A-Za-z])(?=.*\d).{8,128}$/;
export const PASSWORD_MESSAGE = 'La contrasena debe tener entre 8 y 128 caracteres, con letras y numeros';

export const hashPassword = (plain: string) => hash(plain);

export async function verifyPassword(passwordHash: string, plain: string): Promise<boolean> {
  try {
    return await verify(passwordHash, plain);
  } catch {
    return false;
  }
}

let dummyHash: Promise<string> | null = null;

/**
 * Gasta el mismo tiempo que una verificacion real cuando el usuario no existe,
 * para que medir tiempos no revele que correos estan registrados.
 */
export async function burnPasswordCheck(plain: string): Promise<void> {
  dummyHash ??= hash('dummy-password-for-timing');
  await verifyPassword(await dummyHash, plain);
}
