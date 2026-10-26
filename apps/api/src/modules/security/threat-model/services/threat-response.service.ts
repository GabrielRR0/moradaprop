import { Injectable, Logger } from '@nestjs/common';
import { BlockType, Role } from '@prisma/client';
import { AuditService } from '../../../audit';
import { SecurityService } from '../../blocks';
import type { FileCheck, FileFacts, ThreatMode, ThreatShield, ThreatSubject } from '../types';

const CREATED_BY = 'threat-model';

/** Lo que se hace cuando se detecta algo: dejar constancia (auditoria) y, en `enforce`, bloquear por tiempo. */
@Injectable()
export class ThreatResponseService {
  private readonly logger = new Logger(ThreatResponseService.name);

  constructor(
    private readonly audit: AuditService,
    private readonly security: SecurityService,
  ) {}

  async act(shield: ThreatShield, subject: ThreatSubject, count: number, mode: ThreatMode): Promise<void> {
    const blocked = mode === 'enforce' ? await this.block(shield, subject) : false;
    await this.audit.log({
      action: 'threat.detected',
      userId: subject.userId,
      ip: subject.ip,
      resource: 'ThreatShield',
      resourceId: shield.id,
      metadata: { stride: shield.stride, count, windowSec: shield.windowSec, mode, blocked },
    });
  }

  async fileRejected(check: FileCheck, reason: string, file: FileFacts, subject: ThreatSubject): Promise<void> {
    await this.audit.log({
      action: 'threat.file.rejected',
      userId: subject.userId,
      ip: subject.ip,
      resource: 'FileCheck',
      resourceId: check.id,
      metadata: { stride: check.stride, reason, filename: file.filename?.slice(0, 120), bytes: file.buffer.length },
    });
  }

  /** Bloquea al usuario (si esta identificado) o a su IP. Los administradores nunca se bloquean solos. */
  private async block(shield: ThreatShield, subject: ThreatSubject): Promise<boolean> {
    if (subject.roles?.includes(Role.ADMIN)) return false;
    const target = subject.userId
      ? { type: BlockType.USER, value: subject.userId }
      : subject.ip
        ? { type: BlockType.IP, value: subject.ip }
        : null;
    if (!target) return false;

    try {
      const expiresAt = new Date(Date.now() + shield.blockMinutes * 60_000);
      await this.security.blockTemporarily(
        target.type,
        target.value,
        `Modelo de amenazas: ${shield.id} (${shield.stride})`,
        expiresAt,
        CREATED_BY,
      );
      return true;
    } catch (error) {
      this.logger.warn(`No se pudo bloquear (${shield.id}): ${(error as Error).message}`);
      return false;
    }
  }
}
