import { isIPv4 } from 'node:net';

function ipv4ToInt(ip: string): number {
  return ip.split('.').reduce((acc, octet) => (acc << 8) + Number(octet), 0) >>> 0;
}

/** Normaliza IPs de Express (::ffff:1.2.3.4 -> 1.2.3.4). */
export function normalizeIp(ip: string): string {
  return ip.startsWith('::ffff:') ? ip.slice(7) : ip;
}

export function isValidCidr(value: string): boolean {
  const [range, bits, ...rest] = value.split('/');
  if (rest.length || !range || bits === undefined) return false;
  const mask = Number(bits);
  return isIPv4(range) && Number.isInteger(mask) && mask >= 0 && mask <= 32;
}

/** Solo IPv4. Una IPv6 nunca coincide con un CIDR (se bloquea por IP exacta). */
export function ipInCidr(ip: string, cidr: string): boolean {
  const address = normalizeIp(ip);
  if (!isIPv4(address) || !isValidCidr(cidr)) return false;
  const [range, bits] = cidr.split('/');
  const mask = Number(bits) === 0 ? 0 : (~0 << (32 - Number(bits))) >>> 0;
  return (ipv4ToInt(address) & mask) === (ipv4ToInt(range) & mask);
}
