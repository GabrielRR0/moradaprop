import { describeCase } from '../../../../../test/support/describe-case';
import { deviceLabel } from '../utils/device-label';
import { networkOf } from '../utils/network';

describe('access-risk: red de una IP', () => {
  describeCase('access-risk', {
    que: 'IPv4 de la misma red /24 y de otra',
    espera: 'dos IP del mismo bloque dan la misma red; otro bloque da otra',
    ejecutar: () => [networkOf('190.120.5.9'), networkOf('190.120.5.200'), networkOf('190.120.6.9')],
    verificar: ([a, b, c]) => {
      expect(a).toBe('190.120.5.0/24');
      expect(b).toBe(a);
      expect(c).not.toBe(a);
    },
  });

  describeCase('access-risk', {
    que: 'IPv4 que Express entrega mapeada en IPv6 (::ffff:1.2.3.4)',
    espera: 'se trata como la IPv4 normal',
    ejecutar: () => networkOf('::ffff:190.120.5.9'),
    verificar: (r) => expect(r).toBe('190.120.5.0/24'),
  });

  describeCase('access-risk', {
    que: 'IPv6: misma /48 vs otra, con y sin "::"',
    espera: 'la /48 agrupa lo que comparte los primeros 48 bits',
    ejecutar: () => [
      networkOf('2800:370:1234:1::10'),
      networkOf('2800:370:1234:ffff:aaaa:bbbb:cccc:dddd'),
      networkOf('2800:370:9999:1::10'),
      networkOf('::1'),
    ],
    verificar: ([a, b, c, loopback]) => {
      expect(a).toBe('2800:0370:1234::/48');
      expect(b).toBe(a);
      expect(c).not.toBe(a);
      expect(loopback).toBe('0000:0000:0000::/48');
    },
    describirObtenido: (r) => JSON.stringify(r),
  });

  describeCase('access-risk', {
    que: 'valores que no son una IP',
    espera: 'null (nunca se inventa una red)',
    ejecutar: () => [networkOf(undefined), networkOf('unknown'), networkOf(''), networkOf('999.1.1.1'), networkOf('1.2.3')],
    verificar: (r) => expect(r).toEqual([null, null, null, null, null]),
  });
});

describe('access-risk: nombre del dispositivo', () => {
  const CHROME_WIN = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36';
  const EDGE_WIN = `${CHROME_WIN} Edg/126.0.0.0`;
  const IPHONE = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1';
  const ANDROID = 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Mobile Safari/537.36';
  const MAC_SAFARI = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15';
  const FIREFOX_LINUX = 'Mozilla/5.0 (X11; Linux x86_64; rv:127.0) Gecko/20100101 Firefox/127.0';

  describeCase('access-risk', {
    que: 'navegadores y sistemas comunes (Edge y Chrome se parecen; iPhone dice Mac OS X; Android dice Linux)',
    espera: 'solo familia de navegador y sistema, sin versiones',
    ejecutar: () => [CHROME_WIN, EDGE_WIN, IPHONE, ANDROID, MAC_SAFARI, FIREFOX_LINUX].map(deviceLabel),
    verificar: (r) =>
      expect(r).toEqual(['Chrome en Windows', 'Edge en Windows', 'Safari en iOS', 'Chrome en Android', 'Safari en macOS', 'Firefox en Linux']),
    describirObtenido: (r) => r.join(' | '),
  });

  describeCase('access-risk', {
    que: 'sin User-Agent o uno desconocido (ej. una app)',
    espera: '"Dispositivo desconocido" y nunca el texto completo',
    ejecutar: () => [deviceLabel(undefined), deviceLabel(''), deviceLabel('okhttp/4.12.0')],
    verificar: (r) => expect(r).toEqual(['Dispositivo desconocido', 'Dispositivo desconocido', 'Dispositivo desconocido']),
  });
});
