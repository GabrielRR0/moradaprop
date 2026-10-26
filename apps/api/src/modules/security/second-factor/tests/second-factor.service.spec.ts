import { Role } from '@prisma/client';
import { describeCase } from '../../../../../test/support/describe-case';
import type { AppConfig } from '../../../../config';
import type { PrismaService } from '../../../../common/prisma';
import type { PasskeyService } from '../../passkeys';
import { SecondFactorService } from '../services/second-factor.service';
import type { SecondFactorMode } from '../types';

const DAY = 24 * 60 * 60 * 1000;
const dias = (n: number) => new Date(Date.now() + n * DAY);

const setup = (mode: SecondFactorMode, passkeys = false) => {
  const update = jest.fn().mockResolvedValue(undefined);
  const service = new SecondFactorService(
    { security: { secondFactorMode: mode }, app: { isProduction: false } } as unknown as AppConfig,
    { user: { update } } as unknown as PrismaService,
    { hasAny: jest.fn().mockResolvedValue(passkeys) } as unknown as PasskeyService,
  );
  return { service, update };
};

const cuenta = (roles: Role[], extra: { twoFactorEnabled?: boolean; secondFactorRequiredFrom?: Date | null } = {}) => ({
  id: 'u1',
  roles,
  twoFactorEnabled: extra.twoFactorEnabled ?? false,
  secondFactorRequiredFrom: extra.secondFactorRequiredFrom ?? null,
});

describe('SecondFactorService.status', () => {
  describeCase('second-factor', {
    que: 'un cliente sin passkey ni 2FA',
    espera: 'no es obligatorio (se le recomienda) y nunca se bloquea',
    ejecutar: () => setup('enforce').service.status(cuenta([Role.CLIENT])),
    verificar: (s) => expect(s).toMatchObject({ required: false, hasFactor: false, recommended: true, mustEnrollNow: false, blocked: false, graceEndsAt: null }),
  });

  describeCase('second-factor', {
    que: 'un dueño con el plazo todavia vigente',
    espera: 'obligatorio, pero aun no bloquea: dice hasta cuando puede activarlo',
    ejecutar: async () => {
      const limite = dias(5);
      const s = await setup('enforce').service.status(cuenta([Role.CLIENT, Role.OWNER], { secondFactorRequiredFrom: limite }));
      return { s, limite };
    },
    verificar: ({ s, limite }) => {
      expect(s).toMatchObject({ required: true, hasFactor: false, mustEnrollNow: false, blocked: false, recommended: false });
      expect(s.graceEndsAt).toBe(limite.toISOString());
    },
  });

  describeCase('second-factor', {
    que: 'un dueño con el plazo vencido, segun el modo',
    espera: 'enforce: bloqueado; monitor: avisa (mustEnrollNow) pero no bloquea; off: no mide nada',
    ejecutar: async () => {
      const vencido = cuenta([Role.OWNER], { secondFactorRequiredFrom: dias(-1) });
      return {
        enforce: await setup('enforce').service.status(vencido),
        monitor: await setup('monitor').service.status(vencido),
        off: await setup('off').service.status(vencido),
      };
    },
    verificar: ({ enforce, monitor, off }) => {
      expect(enforce).toMatchObject({ mustEnrollNow: true, blocked: true });
      expect(monitor).toMatchObject({ mustEnrollNow: true, blocked: false, mode: 'monitor' });
      expect(off).toMatchObject({ required: false, mustEnrollNow: false, blocked: false });
    },
    describirObtenido: ({ enforce, monitor, off }) => `enforce blocked=${enforce.blocked}; monitor blocked=${monitor.blocked}; off required=${off.required}`,
  });

  describeCase('second-factor', {
    que: 'el plazo empieza al primer token cuando no habia empezado (cuenta existente o que acaba de recibir el rol)',
    espera: 'dueño/agencia: 7 dias de gracia guardados en la base; admin: de inmediato',
    ejecutar: async () => {
      const dueno = setup('enforce');
      const admin = setup('enforce');
      return {
        dueno: await dueno.service.status(cuenta([Role.OWNER])),
        admin: await admin.service.status(cuenta([Role.ADMIN])),
        guardadoDueno: (dueno.update.mock.calls[0][0].data.secondFactorRequiredFrom as Date).getTime() - Date.now(),
        guardadoAdmin: (admin.update.mock.calls[0][0].data.secondFactorRequiredFrom as Date).getTime() - Date.now(),
      };
    },
    verificar: ({ dueno, admin, guardadoDueno, guardadoAdmin }) => {
      expect(dueno).toMatchObject({ mustEnrollNow: false, blocked: false });
      expect(guardadoDueno).toBeGreaterThan(6.99 * DAY);
      expect(guardadoDueno).toBeLessThan(7.01 * DAY);
      expect(admin).toMatchObject({ mustEnrollNow: true, blocked: true });
      expect(Math.abs(guardadoAdmin)).toBeLessThan(5_000);
    },
  });

  describeCase('second-factor', {
    que: 'quien ya tiene 2FA con app o una passkey, aunque el plazo haya vencido',
    espera: 'cumple: no bloquea y no toca la base',
    ejecutar: async () => {
      const vencido = { secondFactorRequiredFrom: dias(-10) };
      const conTotp = setup('enforce');
      const conPasskey = setup('enforce', true);
      return {
        totp: await conTotp.service.status(cuenta([Role.AGENCY], { ...vencido, twoFactorEnabled: true })),
        passkey: await conPasskey.service.status(cuenta([Role.AGENCY], vencido)),
        escrituras: conTotp.update.mock.calls.length + conPasskey.update.mock.calls.length,
      };
    },
    verificar: ({ totp, passkey, escrituras }) => {
      expect(totp).toMatchObject({ required: true, hasFactor: true, mustEnrollNow: false, blocked: false });
      expect(passkey).toMatchObject({ required: true, hasFactor: true, mustEnrollNow: false, blocked: false });
      expect(escrituras).toBe(0);
    },
  });

  describeCase('second-factor', {
    que: 'quien tiene varios roles, uno obligatorio (cliente + dueño)',
    espera: 'se le exige por el rol mas alto',
    ejecutar: () => setup('enforce').service.status(cuenta([Role.CLIENT, Role.OWNER], { secondFactorRequiredFrom: dias(1) })),
    verificar: (s) => expect(s.required).toBe(true),
  });
});
