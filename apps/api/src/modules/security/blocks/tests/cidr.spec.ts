import { describeCase } from '@/../test/support/describe-case';
import { ipInCidr, isValidCidr, normalizeIp } from '../utils/cidr';

describe('cidr', () => {
  describeCase('security', {
    que: 'reconoce si una IP cae dentro de un rango CIDR',
    espera: '190.120.5.9 esta en 190.120.0.0/16; 190.121.0.1 no; /32 es la IP exacta; /0 es todo',
    ejecutar: () => [
      ipInCidr('190.120.5.9', '190.120.0.0/16'),
      ipInCidr('190.121.0.1', '190.120.0.0/16'),
      ipInCidr('10.0.0.5', '10.0.0.5/32'),
      ipInCidr('10.0.0.6', '10.0.0.5/32'),
      ipInCidr('8.8.8.8', '0.0.0.0/0'),
    ],
    verificar: (r) => expect(r).toEqual([true, false, true, false, true]),
  });

  describeCase('security', {
    que: 'normaliza IPs de Express (::ffff:1.2.3.4) y valida el formato CIDR',
    espera: 'quita el prefijo IPv4-mapeado; rechaza /33, texto y IPv6',
    ejecutar: () => ({
      normal: normalizeIp('::ffff:190.120.5.9'),
      invalidos: ['1.2.3.4/33', 'hola/8', '1.2.3.4', '::1/64'].map(isValidCidr),
      ipv4Mapeada: ipInCidr('::ffff:10.1.2.3', '10.0.0.0/8'),
    }),
    verificar: ({ normal, invalidos, ipv4Mapeada }) => {
      expect(normal).toBe('190.120.5.9');
      expect(invalidos).toEqual([false, false, false, false]);
      expect(ipv4Mapeada).toBe(true);
    },
  });
});
