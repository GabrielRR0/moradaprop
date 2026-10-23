import { Injectable, Logger } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../../../common/prisma';
import type { QueryAuditDto } from '../dto/query-audit.dto';
import { sanitize } from '../utils/sanitize';

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

  constructor(private readonly prisma: PrismaService) {}

  /** Registra un evento. Nunca lanza error: la auditoria no debe romper la accion auditada. */
  async log(entry: AuditEntry): Promise<void> {
    try {
      await this.prisma.auditLog.create({
        data: {
          action: entry.action,
          userId: entry.userId ?? null,
          resource: entry.resource,
          resourceId: entry.resourceId,
          ip: entry.ip,
          userAgent: entry.userAgent?.slice(0, 300),
          metadata: entry.metadata === undefined ? undefined : (sanitize(entry.metadata) as Prisma.InputJsonValue),
        },
      });
    } catch (error) {
      this.logger.error(`No se pudo registrar "${entry.action}": ${(error as Error).message}`);
    }
  }

  async list(query: QueryAuditDto) {
    const page = query.page ?? 1;
    const limit = Math.min(query.limit ?? 50, 100);
    const where: Prisma.AuditLogWhereInput = {
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
    return { items, total, page, limit };
  }
}
