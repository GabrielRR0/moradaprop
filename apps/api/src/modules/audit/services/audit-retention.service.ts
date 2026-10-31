import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '@/common/prisma';
import { AUDIT_RETENTION } from '../policy';

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;

/** Borra los eventos anonimos vencidos (AUDIT_RETENTION.anonymousDays). Corre al arrancar y cada pocas horas. */
@Injectable()
export class AuditRetentionService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(AuditRetentionService.name);
  private timer?: NodeJS.Timeout;

  constructor(private readonly prisma: PrismaService) {}

  onModuleInit() {
    void this.purge();
    // unref: este temporizador nunca mantiene vivo el proceso.
    this.timer = setInterval(() => void this.purge(), AUDIT_RETENTION.runEveryHours * HOUR_MS);
    this.timer.unref();
  }

  onModuleDestroy() {
    clearInterval(this.timer);
  }

  /** Devuelve cuantos eventos borro. Un fallo se registra y no tumba nada. */
  async purge(now = new Date()): Promise<number> {
    try {
      const { count } = await this.prisma.auditLog.deleteMany({
        where: { userId: null, createdAt: { lt: new Date(now.getTime() - AUDIT_RETENTION.anonymousDays * DAY_MS) } },
      });
      if (count > 0) this.logger.log(`Auditoria: ${count} evento(s) anonimo(s) con mas de ${AUDIT_RETENTION.anonymousDays} dias borrados`);
      return count;
    } catch (error) {
      this.logger.error(`No se pudo limpiar la auditoria: ${(error as Error).message}`);
      return 0;
    }
  }
}
