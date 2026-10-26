import { isIP } from 'node:net';

/** Expande una IPv6 a sus 8 grupos de 16 bits (maneja "::" y direcciones IPv4 incrustadas). */
function expandIpv6(address: string): string[] | null {
  let value = address.split('%')[0].toLowerCase(); // sin zona (fe80::1%eth0)
  const embedded = value.match(/(\d+\.\d+\.\d+\.\d+)$/);
  if (embedded) {
    const [a, b, c, d] = embedded[1].split('.').map(Number);
    value = value.replace(embedded[1], `${((a << 8) | b).toString(16)}:${((c << 8) | d).toString(16)}`);
  }
  const [head, tail, extra] = value.split('::');
  if (extra !== undefined) return null;
  const left = head ? head.split(':') : [];
  const right = tail ? tail.split(':') : [];
  const missing = 8 - left.length - right.length;
  if (tail === undefined ? left.length !== 8 : missing < 0) return null;
  const groups = tail === undefined ? left : [...left, ...Array<string>(missing).fill('0'), ...right];
  return groups.map((group) => group.padStart(4, '0'));
}

/**
 * La "red" de una IP: la /24 en IPv4 o la /48 en IPv6 (lo que comparte un hogar, una oficina o un plan movil).
 * Cambiar de IP dentro de la misma red no es raro; cambiar de red si. Devuelve null si no es una IP valida.
 */
export function networkOf(ip: string | undefined): string | null {
  if (!ip) return null;
  let address = ip.trim();
  if (address.toLowerCase().startsWith('::ffff:') && isIP(address.slice(7)) === 4) address = address.slice(7);

  if (isIP(address) === 4) return `${address.split('.').slice(0, 3).join('.')}.0/24`;
  if (isIP(address.split('%')[0]) === 6) {
    const groups = expandIpv6(address);
    return groups ? `${groups.slice(0, 3).join(':')}::/48` : null;
  }
  return null;
}
