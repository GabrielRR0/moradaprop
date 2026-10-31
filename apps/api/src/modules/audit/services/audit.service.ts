import { Inject, Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@/common/prisma';
import type { QueryAuditDto } from '../contracts/dto/query-audit.dto';
import type { AuditLogListResource } from '../contracts/resources';
import { AUDIT_FIELD_CIPHER, AUDIT_USER_DECODER, type AuditFieldCipher, type AuditUserDecoder } from '../types';
import { sanitize } from '../utils/sanitize';
import { DbSupport } from '@/support/db';

export interface AuditEntry {
  action: string;
  userId?: string | null;
  resource?: string;
  resourceId?: string;
  ip?: string;
  userAgent?: string;
  metadata?: unknown;
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(AUDIT_USER_DECODER) private readonly users: AuditUserDecoder,
    @Inject(AUDIT_FIELD_CIPHER) private readonly cipher: AuditFieldCipher,
  ) {}

  /** Registra un evento. Nunca lanza error: la auditoria no debe romper la accion auditada. */
  async log(entry: AuditEntry): Promise<void> {
    try {
      await this.prisma.auditLog.create({
        data: {
          action: entry.action,
          userId: entry.userId ?? null,
          resource: entry.resource,
          resourceId: entry.resourceId,
          ip: entry.ip && this.cipher.encrypt('AuditLog.ip', entry.ip),
          userAgent: entry.userAgent && this.cipher.encrypt('AuditLog.userAgent', entry.userAgent.slice(0, 300)),
          metadata:
            entry.metadata === undefined
              ? undefined
              : { enc: this.cipher.encrypt('AuditLog.metadata', JSON.stringify(sanitize(entry.metadata))) },
        },
      });
    } catch (error) {
      this.logger.error(`No se pudo registrar "${entry.action}": ${(error as Error).message}`);
    }
  }

  async list(query: QueryAuditDto): Promise<AuditLogListResource> {
    const page = query.page ?? 1;
    const limit = Math.min(query.limit ?? 50, 100);
    const where: DbSupport.Prisma.AuditLogWhereInput = {
      userId: query.userId,
      action: query.action ? { startsWith: query.action } : undefined,
      resource: query.resource,
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: { user: { select: { id: true, email: true, name: true } } },
      }),
      this.prisma.auditLog.count({ where }),
    ]);
    return { items: items.map((item) => this.reveal(item)), total, page, limit };
  }

  /**
   * Ultimos eventos de UN usuario cuya accion empieza con `prefix` (ej. "risk."), con la metadata ya descifrada.
   * Es para que el usuario vea su propio historial de seguridad: no devuelve ip ni userAgent.
   */
  async recentForUser(userId: string, prefix: string, limit = 30) {
    const rows = await this.prisma.auditLog.findMany({
      where: { userId, action: { startsWith: prefix } },
      orderBy: { createdAt: 'desc' },
      take: Math.min(limit, 100),
    });
    return rows.map((row) => {
      const { metadata } = this.reveal({ ...row, user: null });
      return { id: row.id, action: row.action, createdAt: row.createdAt, metadata: metadata as Record<string, unknown> | null };
    });
  }

  /** Descifra ip, userAgent, metadata y el usuario de un evento para mostrarlo en el panel admin. */
  private reveal<T extends { ip: string | null; userAgent: string | null; metadata: DbSupport.Prisma.JsonValue; user: { email?: string | null; name?: string | null } | null }>(item: T): T {
    const enc = (item.metadata as { enc?: unknown } | null)?.enc;
    return {
      ...item,
      ip: item.ip && this.cipher.decrypt('AuditLog.ip', item.ip),
      userAgent: item.userAgent && this.cipher.decrypt('AuditLog.userAgent', item.userAgent),
      metadata: typeof enc === 'string' ? JSON.parse(this.cipher.decrypt('AuditLog.metadata', enc)) : item.metadata,
      user: item.user ? this.users.decode(item.user) : item.user,
    };
  }
}
