import { WebAuthnError } from './types';

/**
 * Lector minimo de CBOR (RFC 8949) para lo que usa WebAuthn: enteros, bytes, texto, listas y mapas.
 * Procesa datos que manda el CLIENTE, asi que es estricto: nada de longitudes indefinidas, etiquetas ni flotantes,
 * profundidad y tamano acotados, UTF-8 valido y claves de mapa unicas. Cualquier cosa rara = error.
 */
export type CborValue = number | string | boolean | null | undefined | Buffer | CborValue[] | Map<number | string, CborValue>;

const MAX_DEPTH = 6;
const MAX_ITEMS = 128;
const utf8 = new TextDecoder('utf-8', { fatal: true });

const fail = (detail: string): never => {
  throw new WebAuthnError('bad-encoding', `cbor: ${detail}`);
};

function readItem(buf: Buffer, start: number, depth: number): [CborValue, number] {
  if (depth > MAX_DEPTH) return fail('demasiado anidado');
  let pos = start;
  const need = (n: number) => {
    if (n < 0 || pos + n > buf.length) fail('datos truncados');
  };

  need(1);
  const initial = buf[pos++];
  const major = initial >> 5;
  const info = initial & 31;

  if (major === 7) {
    if (info === 20) return [false, pos];
    if (info === 21) return [true, pos];
    if (info === 22) return [null, pos];
    if (info === 23) return [undefined, pos];
    return fail('tipo simple o flotante no soportado');
  }
  if (major === 6) return fail('etiquetas no soportadas');

  let arg: number;
  if (info < 24) {
    arg = info;
  } else if (info === 24) {
    need(1);
    arg = buf[pos];
    pos += 1;
  } else if (info === 25) {
    need(2);
    arg = buf.readUInt16BE(pos);
    pos += 2;
  } else if (info === 26) {
    need(4);
    arg = buf.readUInt32BE(pos);
    pos += 4;
  } else if (info === 27) {
    need(8);
    const big = buf.readBigUInt64BE(pos);
    if (big > BigInt(Number.MAX_SAFE_INTEGER)) return fail('entero demasiado grande');
    arg = Number(big);
    pos += 8;
  } else {
    return fail('longitud indefinida o reservada');
  }

  switch (major) {
    case 0:
      return [arg, pos];
    case 1:
      return [-1 - arg, pos];
    case 2: {
      need(arg);
      return [Buffer.from(buf.subarray(pos, pos + arg)), pos + arg];
    }
    case 3: {
      need(arg);
      try {
        return [utf8.decode(buf.subarray(pos, pos + arg)), pos + arg];
      } catch {
        return fail('texto no es UTF-8 valido');
      }
    }
    case 4: {
      if (arg > MAX_ITEMS) return fail('lista demasiado larga');
      const list: CborValue[] = [];
      for (let i = 0; i < arg; i++) {
        const [item, next] = readItem(buf, pos, depth + 1);
        list.push(item);
        pos = next;
      }
      return [list, pos];
    }
    default: {
      // major 5: mapa
      if (arg > MAX_ITEMS) return fail('mapa demasiado grande');
      const map = new Map<number | string, CborValue>();
      for (let i = 0; i < arg; i++) {
        const [key, afterKey] = readItem(buf, pos, depth + 1);
        if (typeof key !== 'number' && typeof key !== 'string') return fail('clave de mapa invalida');
        if (map.has(key)) return fail('clave de mapa repetida');
        const [value, afterValue] = readItem(buf, afterKey, depth + 1);
        map.set(key, value);
        pos = afterValue;
      }
      return [map, pos];
    }
  }
}

/** Lee UN valor CBOR desde `offset`. Devuelve el valor y donde termino (para saber que sigue despues). */
export function decodeCbor(buf: Buffer, offset = 0): { value: CborValue; end: number } {
  const [value, end] = readItem(buf, offset, 0);
  return { value, end };
}

/** Lee un valor CBOR que ocupa TODO el buffer (sin bytes sobrantes). */
export function decodeCborExact(buf: Buffer): CborValue {
  const { value, end } = decodeCbor(buf);
  if (end !== buf.length) fail('bytes sobrantes');
  return value;
}
