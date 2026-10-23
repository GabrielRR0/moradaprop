/**
 * Detecta el tipo REAL de un archivo por sus primeros bytes ("magic bytes").
 * Nunca se confia en la extension ni en el Content-Type que manda el cliente.
 */
export type DetectedFile = 'jpeg' | 'png' | 'webp' | 'xlsx' | 'csv' | 'unknown';

const startsWith = (buffer: Buffer, bytes: number[], offset = 0) =>
  buffer.length >= offset + bytes.length && bytes.every((byte, i) => buffer[offset + i] === byte);

export function detectImage(buffer: Buffer): 'jpeg' | 'png' | 'webp' | null {
  if (startsWith(buffer, [0xff, 0xd8, 0xff])) return 'jpeg';
  if (startsWith(buffer, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return 'png';
  // WebP: "RIFF" + 4 bytes de tamano + "WEBP"
  if (startsWith(buffer, [0x52, 0x49, 0x46, 0x46]) && startsWith(buffer, [0x57, 0x45, 0x42, 0x50], 8)) return 'webp';
  return null;
}

/** .xlsx es un zip (PK\x03\x04). Se rechaza si trae macros (vbaProject.bin => .xlsm disfrazado). */
export function detectSpreadsheet(buffer: Buffer): 'xlsx' | 'csv' | null {
  if (startsWith(buffer, [0x50, 0x4b, 0x03, 0x04])) {
    return buffer.includes('vbaProject.bin') ? null : 'xlsx';
  }
  return looksLikeCsv(buffer) ? 'csv' : null;
}

/** CSV = texto sin bytes de control (sin NUL ni binarios) y con al menos un separador. */
function looksLikeCsv(buffer: Buffer): boolean {
  const sample = buffer.subarray(0, 4096);
  if (sample.length === 0) return false;
  for (const byte of sample) {
    const isControl = byte < 0x09 || (byte > 0x0d && byte < 0x20);
    if (isControl) return false;
  }
  return sample.toString('utf8').includes(',') || sample.toString('utf8').includes(';');
}
