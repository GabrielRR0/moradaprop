/**
 * Une un nombre de clase con "on" cuando el elemento está activo.
 *   classIf('role', true)  -> "role on"
 *   classIf('role', false) -> "role"
 */
export function classIf(baseClass: string, isOn: boolean): string {
  return isOn ? `${baseClass} on` : baseClass;
}
