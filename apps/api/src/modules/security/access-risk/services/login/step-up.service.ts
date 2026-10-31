import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/common/prisma';
import type { RequestContext } from '@/common/security/types';
import { AuditService } from '@/modules/audit';
import { DbSupport } from '@/support/db';
import { ThreatModelService } from '@/modules/security/threat-model';
import { RISK_POLICY } from '../../policy';

const MINUTE_MS = 60_000;

/** Un segundo factor que falla en un inicio de sesion ALTO: a los N fallos se bloquea la cuenta. */
@Injectable()
export class StepUpService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly threats: ThreatModelService,
  ) {}

  /**
   * Un codigo de segundo factor fallo en un inicio de sesion ALTO. A los N fallos recientes: se bloquea la cuenta,
   * queda auditado y se cuenta contra el escudo `account-takeover-attempt` (que bloquea la IP en `enforce`).
   */
  async stepUpFailed(user: Pick<DbSupport.User, 'id'>, context: RequestContext): Promise<void> {
    const { maxFailures, windowMinutes, lockMinutes } = RISK_POLICY.stepUp;
    await this.audit.log({ action: 'risk.stepup.failed', userId: user.id, ip: context.ip, userAgent: context.userAgent });

    const failures = await this.prisma.auditLog.count({
      where: { userId: user.id, action: 'risk.stepup.failed', createdAt: { gte: new Date(Date.now() - windowMinutes * MINUTE_MS) } },
    });
    if (failures < maxFailures) return;

    await this.prisma.user.update({ where: { id: user.id }, data: { lockedUntil: new Date(Date.now() + lockMinutes * MINUTE_MS) } });
    await this.audit.log({
      action: 'risk.account.locked',
      userId: user.id,
      ip: context.ip,
      userAgent: context.userAgent,
      metadata: { failures, lockMinutes },
    });
    // Solo la IP: pasar el userId bloquearia a la VICTIMA, no al atacante.
    await this.threats.report('account-takeover-attempt', { ip: context.ip });
  }
}
