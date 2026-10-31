import { Injectable } from '@nestjs/common';
import type { CreateBlockRuleDto } from '../contracts/dto/create-block-rule.dto';
import { BlockCheckService, type BlockContext } from './block-check.service';
import type { BlockIpFromLogDto } from '../contracts/dto/block-ip-from-log.dto';
import { BlockFromLogService } from './block-from-log.service';
import { BlockRuleService } from './block-rule.service';

/** Fachada del modulo: lo que otros modulos pueden usar de seguridad. */
@Injectable()
export class SecurityService {
  constructor(
    private readonly blockCheck: BlockCheckService,
    private readonly blockRules: BlockRuleService,
    private readonly blockFromLog: BlockFromLogService,
  ) {}

  isBlocked(context: BlockContext) {
    return this.blockCheck.isBlocked(context);
  }

  assertNotBlocked(context: BlockContext) {
    return this.blockCheck.assertNotBlocked(context);
  }

  listRules() {
    return this.blockRules.list();
  }

  createRule(dto: CreateBlockRuleDto, createdBy: string) {
    return this.blockRules.create(dto, createdBy);
  }

  /** Bloquea la IP de un evento del visor de auditoria (no la del propio admin). */
  blockIpFromLog(dto: BlockIpFromLogDto, adminId: string, adminIp: string) {
    return this.blockFromLog.blockIp(dto, adminId, adminIp);
  }

  /** Corta el acceso de un usuario YA (se evalua en cada peticion, no espera a que venza su token). */
  blockUser(userId: string, reason: string, createdBy: string) {
    return this.blockRules.blockUser(userId, reason, createdBy);
  }

  blockTemporarily(...args: Parameters<BlockRuleService['blockTemporarily']>) {
    return this.blockRules.blockTemporarily(...args);
  }

  unblockUser(userId: string) {
    return this.blockRules.unblockUser(userId);
  }

  removeRule(id: string) {
    return this.blockRules.remove(id);
  }
}
