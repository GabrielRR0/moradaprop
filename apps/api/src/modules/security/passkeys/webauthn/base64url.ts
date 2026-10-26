import { WebAuthnError } from './types';

// La especificacion pide base64url SIN relleno, pero hay clientes (frontends armados a mano con btoa) que lo dejan: se acepta.
const BASE64URL = /^[A-Za-z0-9_-]*={0,2}$/;

/** Quita el relleno (=) del final: asi el mismo valor siempre se escribe igual al compararlo o buscarlo. */
export const stripPadding = (value: string): string => value.replace(/=+$/, '');

/** base64url -> bytes. Estricto: Buffer.from "perdona" caracteres raros, aqui un caracter invalido es error. */
export function fromBase64url(value: unknown, maxBytes: number): Buffer {
  if (typeof value !== 'string' || !BASE64URL.test(value) || value.length > Math.ceil((maxBytes * 4) / 3) + 4) {
    throw new WebAuthnError('bad-encoding', 'base64url invalido o demasiado largo');
  }
  return Buffer.from(value, 'base64url');
}

export const toBase64url = (bytes: Buffer): string => bytes.toString('base64url');
