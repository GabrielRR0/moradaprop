import { describeCase } from '@test/support/describe-case';
import { MailService } from '../mail.service';
import type { MailConfigSource, MailConnection } from '../mail-config-source';

const mockCreated: Array<Record<string, unknown>> = [];
const mockSendMail = jest.fn().mockResolvedValue(undefined);

jest.mock('nodemailer', () => ({
  createTransport: (options: Record<string, unknown>) => {
    mockCreated.push(options);
    return { sendMail: mockSendMail };
  },
}));

const config = { app: { name: 'Portal' }, mail: { host: 'localhost', port: 1025, user: undefined, password: undefined, from: 'no-reply@localhost' } } as never;
const origen = (conexion: MailConnection | null): MailConfigSource => ({ current: async () => conexion });

describe('MailService: de donde sale la conexion', () => {
  beforeEach(() => {
    mockCreated.length = 0;
    mockSendMail.mockClear();
  });

  describeCase('mail', {
    que: 'sin nada guardado usa las variables MAIL_*',
    espera: 'conexion a localhost:1025 y remitente de MAIL_FROM',
    ejecutar: async () => {
      await new MailService(config, origen(null)).sendOrThrow('a@b.com', { name: 'test-email' });
      return { opciones: mockCreated[0], from: mockSendMail.mock.calls[0][0].from };
    },
    verificar: ({ opciones, from }) => {
      expect(opciones).toMatchObject({ host: 'localhost', port: 1025, secure: false });
      expect(from).toBe('no-reply@localhost');
    },
  });

  describeCase('mail', {
    que: 'con la API key de Resend guardada usa smtp.resend.com y el remitente del admin',
    espera: 'host smtp.resend.com, puerto 465 seguro, usuario "resend" y el remitente guardado',
    ejecutar: async () => {
      const resend = { host: 'smtp.resend.com', port: 465, user: 'resend', password: 're_clave', from: 'Portal <no-reply@midominio.com>' };
      await new MailService(config, origen(resend)).sendOrThrow('a@b.com', { name: 'test-email' });
      return { opciones: mockCreated[0], from: mockSendMail.mock.calls[0][0].from };
    },
    verificar: ({ opciones, from }) => {
      expect(opciones).toMatchObject({ host: 'smtp.resend.com', port: 465, secure: true, auth: { user: 'resend', pass: 're_clave' } });
      expect(from).toBe('Portal <no-reply@midominio.com>');
    },
  });

  describeCase('mail', {
    que: 'reutiliza la conexion mientras los datos no cambian y crea otra si cambian',
    espera: '1 conexion para 2 envios iguales; 2 al cambiar la clave',
    ejecutar: async () => {
      let clave = 're_uno';
      const cambiante: MailConfigSource = { current: async () => ({ host: 'smtp.resend.com', port: 465, user: 'resend', password: clave }) };
      const mail = new MailService(config, cambiante);
      await mail.sendOrThrow('a@b.com', { name: 'test-email' });
      await mail.sendOrThrow('a@b.com', { name: 'test-email' });
      const antes = mockCreated.length;
      clave = 're_dos';
      await mail.sendOrThrow('a@b.com', { name: 'test-email' });
      return { antes, despues: mockCreated.length };
    },
    verificar: ({ antes, despues }) => expect([antes, despues]).toEqual([1, 2]),
  });

  describeCase('mail', {
    que: 'si falla leer lo guardado, no se pierde el correo: usa el entorno',
    espera: 'envia por localhost:1025',
    ejecutar: async () => {
      const roto: MailConfigSource = { current: async () => Promise.reject(new Error('base caida')) };
      await new MailService(config, roto).sendOrThrow('a@b.com', { name: 'test-email' });
      return mockCreated[0];
    },
    verificar: (opciones) => expect(opciones).toMatchObject({ host: 'localhost', port: 1025 }),
  });

  describeCase('mail', {
    que: 'send no lanza el error del servidor; sendOrThrow si',
    espera: 'send termina bien y sendOrThrow rechaza',
    ejecutar: async () => {
      mockSendMail.mockRejectedValueOnce(new Error('535 Authentication failed')).mockRejectedValueOnce(new Error('535 Authentication failed'));
      const mail = new MailService(config, origen(null));
      const send = await mail.send('a@b.com', { name: 'test-email' }).then(() => 'ok', () => 'lanzo');
      const orThrow = await mail.sendOrThrow('a@b.com', { name: 'test-email' }).then(() => 'ok', () => 'lanzo');
      return { send, orThrow };
    },
    verificar: (r) => expect(r).toEqual({ send: 'ok', orThrow: 'lanzo' }),
  });
});
