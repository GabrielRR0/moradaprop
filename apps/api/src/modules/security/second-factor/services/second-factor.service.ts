import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { AppConfig } from '@/config';
import { PrismaService } from '@/common/prisma';
import { PasskeyService } from '@/modules/security/passkeys';
import { SECOND_FACTOR_POLICY } from '../policy';
import type { SecondFactorMode, SecondFactorStatus } from '../types';
import { DbSupport } from '@/support/db';

const DAY_MS = 24 * 60 * 60 * 1000;

type Subject = Pick<DbSupport.User, 'id' | 'roles' | 'twoFactorEnabled' | 'secondFactorRequiredFrom'>;

/**
 * ¿Debe esta cuenta tener passkey o 2FA, y ya lo tiene? Admin, dueños y agencias manejan datos de otros: se les exige.
 * Clientes: solo se les recomienda. Con `enforce`, quien no cumple solo puede usar las rutas de enrolamiento.
 */
@Injectable()
export class SecondFactorService implements OnModuleInit {
  private readonly logger = new Logger(SecondFactorService.name);

  constructor(
    private readonly config: AppConfig,
    private readonly prisma: PrismaService,
    private readonly passkeys: PasskeyService,
  ) {}

  get mode(): SecondFactorMode {
    return this.config.security.secondFactorMode;
  }

  onModuleInit() {
    if (this.config.app.isProduction && this.mode !== 'enforce') {
      this.logger.warn(`SECOND_FACTOR_MODE=${this.mode}: en produccion usa "enforce" para que admin, duenos y agencias deban activar passkey o 2FA`);
    }
  }

  /** Comprobacion FRESCA en la base (no confia en el token): la usa el guard antes de bloquear. */
  async hasFactor(userId: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { twoFactorEnabled: true } });
    return Boolean(user?.twoFactorEnabled) || this.passkeys.hasAny(userId);
  }

  /** Estado de la cuenta del token. */
  async statusOf(userId: string): Promise<SecondFactorStatus> {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: { id: true, roles: true, twoFactorEnabled: true, secondFactorRequiredFrom: true },
    });
    return this.status(user);
  }

  /**
   * Estado de una cuenta. `known.hasPasskey` evita repetir la consulta cuando quien llama ya la hizo. Si la cuenta debe
   * tener factor, no lo tiene y su plazo no habia empezado, empieza aqui (admin: ya; los demas: en `graceDays`).
   */
  async status(user: Subject, known: { hasPasskey?: boolean } = {}): Promise<SecondFactorStatus> {
    const mode = this.mode;
    if (mode === 'off') return { mode, required: false, hasFactor: false, mustEnrollNow: false, graceEndsAt: null, recommended: false, blocked: false };

    const required = user.roles.some((role) => SECOND_FACTOR_POLICY.requiredRoles.includes(role));
    const hasFactor = user.twoFactorEnabled || (known.hasPasskey ?? (await this.passkeys.hasAny(user.id)));
    const base = { mode, required, hasFactor, mustEnrollNow: false, graceEndsAt: null, recommended: !required && !hasFactor, blocked: false };
    if (!required || hasFactor) return base;

    let deadline = user.secondFactorRequiredFrom;
    if (!deadline) {
      deadline = this.startOfPlazo(user.roles);
      await this.prisma.user.update({ where: { id: user.id }, data: { secondFactorRequiredFrom: deadline } });
    }
    const mustEnrollNow = deadline.getTime() <= Date.now();
    return { ...base, mustEnrollNow, graceEndsAt: deadline.toISOString(), blocked: mode === 'enforce' && mustEnrollNow };
  }

  private startOfPlazo(roles: readonly DbSupport.User['roles'][number][]): Date {
    const immediate = roles.some((role) => SECOND_FACTOR_POLICY.immediateRoles.includes(role));
    return new Date(Date.now() + (immediate ? 0 : SECOND_FACTOR_POLICY.graceDays * DAY_MS));
  }
}
