import type { FileCheck } from '../types';

const DANGEROUS_EXTENSIONS = new Set([
  'exe', 'dll', 'bat', 'cmd', 'com', 'scr', 'msi', 'pif', 'cpl', 'lnk', 'reg', 'hta',
  'js', 'jse', 'vbs', 'vbe', 'wsf', 'ps1', 'sh', 'php', 'phtml', 'jar',
]);
// Caracteres de ruta, nulo y de direccion de texto (U+202E invierte "gpj.exe" para que parezca "exe.jpg").
const SUSPICIOUS_CHARS = /[\0\\/‪-‮⁦-⁩]/;

/** T: nombres con doble extension (foto.php.jpg), extension peligrosa o caracteres que disfrazan el nombre. */
export const dangerousFilename: FileCheck = {
  id: 'dangerous-filename',
  stride: 'T',
  description: 'Nombres con extension peligrosa, doble extension o caracteres de control.',
  inspect: ({ filename }) => {
    if (!filename) return null;
    if (SUSPICIOUS_CHARS.test(filename)) return 'nombre con caracteres de ruta o de control';
    const dangerous = filename.toLowerCase().split('.').slice(1).find((part) => DANGEROUS_EXTENSIONS.has(part));
    return dangerous ? `extension peligrosa .${dangerous}` : null;
  },
};
