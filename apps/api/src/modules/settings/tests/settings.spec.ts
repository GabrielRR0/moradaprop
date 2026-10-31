import { describeCase } from '@test/support/describe-case';
import { buildAdminRoutes } from '@/routes/admin.routes';
import { isSettingKey, SETTING_KEYS } from '../registry/setting-keys';
import { maskSecret } from '../services/settings.service';

describe('Ajustes de la plataforma', () => {
  describeCase('settings', {
    que: 'solo se aceptan las claves del registro',
    espera: 'las del registro si; una inventada o una heredada de Object no',
    ejecutar: () => ['mail.resendApiKey', 'mail.fromAddress', 'mail.otra', 'constructor', '__proto__'].map(isSettingKey),
    verificar: (r) => expect(r).toEqual([true, true, false, false, false]),
  });

  describeCase('settings', {
    que: 'valida el valor segun la clave',
    espera: 'API key con prefijo re_, correo valido y nombre sin saltos de linea',
    ejecutar: () => ({
      keyOk: SETTING_KEYS['mail.resendApiKey'].validate('re_AbCdEfGh12345678_xyz'),
      keyMala: SETTING_KEYS['mail.resendApiKey'].validate('sk_live_1234567890123456'),
      correoOk: SETTING_KEYS['mail.fromAddress'].validate('no-reply@midominio.com'),
      correoMalo: SETTING_KEYS['mail.fromAddress'].validate('no-es-correo'),
      nombreOk: SETTING_KEYS['mail.fromName'].validate('Portal de Alquileres'),
      nombreInyeccion: SETTING_KEYS['mail.fromName'].validate('Portal\r\nBcc: otro@x.com'),
    }),
    verificar: (r) => {
      expect(r.keyOk).toBeNull();
      expect(r.keyMala).not.toBeNull();
      expect(r.correoOk).toBeNull();
      expect(r.correoMalo).not.toBeNull();
      expect(r.nombreOk).toBeNull();
      expect(r.nombreInyeccion).not.toBeNull();
    },
    describirObtenido: (r) => JSON.stringify(r),
  });

  describeCase('settings', {
    que: 'un secreto se enmascara dejando solo el inicio y el final',
    espera: 're_••••xyz9 y nunca la clave completa',
    ejecutar: () => maskSecret('re_AbCdEfGh12345678_xyz9'),
    verificar: (m) => {
      expect(m).toBe('re_••••xyz9');
      expect(m).not.toContain('AbCdEf');
    },
  });

  describeCase('settings', {
    que: 'las rutas de admin cuelgan del prefijo configurado',
    espera: 'el prefijo dado y no "admin"',
    ejecutar: () => buildAdminRoutes('ctl-7f3k9x')[0].path,
    verificar: (path) => expect(path).toBe('ctl-7f3k9x'),
  });
});
