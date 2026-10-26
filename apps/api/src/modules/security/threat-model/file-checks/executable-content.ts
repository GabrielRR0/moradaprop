import type { FileCheck } from '../types';

const startsWith = (b: Buffer, ...bytes: number[]) => bytes.every((value, i) => b[i] === value);

/** Tipo de ejecutable o script segun sus primeros bytes, o null. Las firmas son precisas para no rechazar un CSV legitimo. */
function executableKind(b: Buffer): string | null {
  if (startsWith(b, 0x7f, 0x45, 0x4c, 0x46)) return 'ELF (Linux)';
  if (b.length >= 0x40 && startsWith(b, 0x4d, 0x5a)) {
    const pe = b.readUInt32LE(0x3c); // "MZ" solo cuenta si apunta a una cabecera PE real
    if (pe + 4 <= b.length && b.readUInt32BE(pe) === 0x50450000) return 'PE (Windows)';
  }
  if (b.length >= 4 && [0xfeedface, 0xfeedfacf, 0xcefaedfe, 0xcffaedfe, 0xcafebabe].includes(b.readUInt32BE(0))) {
    return 'Mach-O / Java class';
  }
  if (startsWith(b, 0x23, 0x21)) return 'script con shebang (#!)';
  const head = b.subarray(0, 256).toString('latin1').trimStart().toLowerCase();
  if (head.startsWith('<?php') || head.startsWith('<script') || head.startsWith('<html')) return 'script web';
  return null;
}

/** T: un archivo que dice ser imagen o planilla pero empieza como programa o script. */
export const executableContent: FileCheck = {
  id: 'executable-content',
  stride: 'T',
  description: 'Programas (exe, ELF, Mach-O) y scripts disfrazados de imagen o planilla.',
  inspect: (file) => executableKind(file.buffer),
};
