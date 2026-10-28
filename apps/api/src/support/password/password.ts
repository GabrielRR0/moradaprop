import * as argon2 from 'argon2';

/** Regla de contrasena (la usan los DTO): 8-128 caracteres con al menos una letra y un numero. */
export const PATTERN = /^(?=.*[A-Za-z])(?=.*\d).{8,128}$/;
export const MESSAGE = 'La contrasena debe tener entre 8 y 128 caracteres, con letras y numeros';

export const hash = (plain: string) => argon2.hash(plain);

export async function verify(passwordHash: string, plain: string): Promise<boolean> {
  try {
    return await argon2.verify(passwordHash, plain);
  } catch {
    return false;
  }
}

let dummyHash: Promise<string> | null = null;

/**
 * Gasta el mismo tiempo que una verificacion real cuando el usuario no existe,
 * para que medir tiempos no revele que correos estan registrados.
 */
export async function burnCheck(plain: string): Promise<void> {
  dummyHash ??= hash('dummy-password-for-timing');
  await verify(await dummyHash, plain);
}
