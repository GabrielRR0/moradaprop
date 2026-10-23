const EOCD_SIGNATURE = 0x06054b50;
const CENTRAL_HEADER_SIGNATURE = 0x02014b50;

export interface ZipSummary {
  entries: number;
  uncompressedBytes: number;
}

/**
 * Lee SOLO el directorio central de un zip (sin descomprimir nada) y suma lo que ocuparia
 * al descomprimir. Un "zip bomb" declara gigas dentro de pocos KB: se detecta antes de abrirlo.
 * Devuelve null si la estructura es invalida.
 */
export function summarizeZip(buffer: Buffer): ZipSummary | null {
  // El registro final (EOCD) mide 22 bytes y esta al final (puede llevar un comentario de hasta 64 KB).
  const minOffset = Math.max(0, buffer.length - 22 - 0xffff);
  let eocd = -1;
  for (let i = buffer.length - 22; i >= minOffset; i--) {
    if (buffer.readUInt32LE(i) === EOCD_SIGNATURE) {
      eocd = i;
      break;
    }
  }
  if (eocd < 0) return null;

  const entries = buffer.readUInt16LE(eocd + 10);
  let offset = buffer.readUInt32LE(eocd + 16);
  let uncompressedBytes = 0;

  for (let i = 0; i < entries; i++) {
    if (offset + 46 > buffer.length || buffer.readUInt32LE(offset) !== CENTRAL_HEADER_SIGNATURE) return null;
    uncompressedBytes += buffer.readUInt32LE(offset + 24);
    const nameLength = buffer.readUInt16LE(offset + 28);
    const extraLength = buffer.readUInt16LE(offset + 30);
    const commentLength = buffer.readUInt16LE(offset + 32);
    offset += 46 + nameLength + extraLength + commentLength;
  }
  return { entries, uncompressedBytes };
}

export const MAX_UNCOMPRESSED_BYTES = 50 * 1024 * 1024;
export const MAX_ZIP_ENTRIES = 200;

/** true si el zip es razonable para una planilla (pocas entradas, tamano descomprimido acotado). */
export function isSafeZip(buffer: Buffer): boolean {
  const summary = summarizeZip(buffer);
  return Boolean(summary) && summary!.entries <= MAX_ZIP_ENTRIES && summary!.uncompressedBytes <= MAX_UNCOMPRESSED_BYTES;
}
