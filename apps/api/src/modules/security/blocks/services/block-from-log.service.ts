import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { AuditService } from '@/modules/audit';
import { DbSupport } from '@/support/db';
import type { BlockIpFromLogDto } from '../contracts/dto/block-ip-from-log.dto';
import { normalizeIp } from '../utils/cidr';
import { BlockRuleService } from './block-rule.service';

const HOUR_MS = 60 * 60 * 1000;

/** Bloquea con un clic la IP de un evento del visor de auditoria. */
@Injectable()
export class BlockFromLogService {
  constructor(
    private readonly audit: AuditService,
    private readonly rules: BlockRuleService,
  ) {}

  /** `adminIp` es la IP desde la que pide el admin: no puede bloquearse a si mismo. */
  async blockIp(dto: BlockIpFromLogDto, adminId: string, adminIp: string) {
    const ip = await this.audit.ipOf(dto.auditLogId);
    if (!ip) throw new NotFoundException('Ese evento no existe o no tiene IP');
    if (normalizeIp(ip) === normalizeIp(adminIp)) throw new BadRequestException('No puedes bloquear tu propia IP');

    return this.rules.create(
      {
        type: DbSupport.BlockType.IP,
        value: ip,
        reason: dto.reason ?? 'Bloqueada desde el visor de auditoria',
        expiresAt: dto.hours ? new Date(Date.now() + dto.hours * HOUR_MS).toISOString() : undefined,
      },
      adminId,
    );
  }
}
