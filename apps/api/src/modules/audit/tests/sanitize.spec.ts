import { describeCase } from '@/../test/support/describe-case';
import { sanitize } from '../utils/sanitize';

describe('sanitize (auditoria)', () => {
  describeCase('audit', {
    que: 'oculta contrasenas, tokens, codigos y secretos, tambien dentro de objetos anidados y listas',
    espera: 'todos esos campos salen como [REDACTADO]; los demas se conservan',
    ejecutar: () =>
      sanitize({
        email: 'a@b.com',
        password: 'Clave123',
        nuevaPassword: 'x',
        accessToken: 'abc',
        code: '123456',
        twoFactorSecret: 's',
        anidado: { refreshToken: 'r', nombre: 'Ana' },
        lista: [{ backupCodes: ['a'], titulo: 'Casa' }],
      }),
    verificar: (r) =>
      expect(r).toEqual({
        email: 'a@b.com',
        password: '[REDACTADO]',
        nuevaPassword: '[REDACTADO]',
        accessToken: '[REDACTADO]',
        code: '[REDACTADO]',
        twoFactorSecret: '[REDACTADO]',
        anidado: { refreshToken: '[REDACTADO]', nombre: 'Ana' },
        lista: [{ backupCodes: '[REDACTADO]', titulo: 'Casa' }],
      }),
  });

  describeCase('audit', {
    que: 'acota el tamano: corta textos largos, listas largas y estructuras muy profundas',
    espera: 'texto de 300 + "..."; lista de 20; profundidad marcada',
    ejecutar: () => ({
      texto: (sanitize('x'.repeat(1000)) as string).length,
      lista: (sanitize(Array.from({ length: 100 }, (_, i) => i)) as unknown[]).length,
      profundo: JSON.stringify(sanitize({ a: { b: { c: { d: { e: { f: { g: 1 } } } } } } })).includes('[PROFUNDIDAD]'),
    }),
    verificar: ({ texto, lista, profundo }) => {
      expect(texto).toBe(303);
      expect(lista).toBe(20);
      expect(profundo).toBe(true);
    },
  });
});
