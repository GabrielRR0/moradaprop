/**
 * Nombre legible de un dispositivo ("Chrome en Windows") a partir del User-Agent. Solo familia de navegador y
 * sistema: nunca versiones ni el texto completo, que identifican a la persona. El orden importa: Edge y Opera
 * dicen "Chrome", y Chrome dice "Safari"; el iPhone dice "Mac OS X" y Android dice "Linux".
 */
export function deviceLabel(userAgent: string | undefined): string {
  const ua = userAgent ?? '';
  const browser = /Edg(e|A|iOS)?\//.test(ua)
    ? 'Edge'
    : /OPR\/|Opera/.test(ua)
      ? 'Opera'
      : /Firefox\/|FxiOS\//.test(ua)
        ? 'Firefox'
        : /Chrome\/|CriOS\//.test(ua)
          ? 'Chrome'
          : /Safari\//.test(ua)
            ? 'Safari'
            : null;
  const os = /iPhone|iPad|iPod/.test(ua)
    ? 'iOS'
    : /Android/.test(ua)
      ? 'Android'
      : /Windows/.test(ua)
        ? 'Windows'
        : /Mac OS X|Macintosh/.test(ua)
          ? 'macOS'
          : /Linux|X11/.test(ua)
            ? 'Linux'
            : null;

  if (browser && os) return `${browser} en ${os}`;
  return browser ?? os ?? 'Dispositivo desconocido';
}
