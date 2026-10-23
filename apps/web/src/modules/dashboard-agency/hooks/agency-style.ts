/** Pequeños cálculos de color que usan varias pantallas del panel. */

/** Fondo y texto de una "píldora" de estado: el color suave de fondo y el texto más oscuro. */
export function badgeStyle(color: string): string {
  return `background:color-mix(in srgb, ${color} 16%, var(--surf)); color:color-mix(in srgb, ${color} 75%, var(--text))`;
}

/** Tono de la foto de reemplazo (cuando la propiedad no tiene foto). `percent` va de 10 a 30 aprox. */
export function photoTint(percent: number): string {
  return `background:color-mix(in srgb, var(--ac) ${percent}%, var(--surf2))`;
}

/** Iniciales de un nombre: "Carlos P." -> "CP". */
export function initialsOf(name: string): string {
  return name
    .split(' ')
    .map((word) => word[0])
    .join('');
}
