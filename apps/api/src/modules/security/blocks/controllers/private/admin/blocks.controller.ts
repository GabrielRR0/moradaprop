import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ClientIp, CurrentUser, RecentTwoFactor } from '@/common/security/decorators';
import { AdminGroup } from '@/common/security/groups';
import type { AuthUserContext } from '@/common/security/types';
import { Audit } from '@/modules/audit';
import { BlockIpFromLogDto } from '@/modules/security/blocks/contracts/dto/block-ip-from-log.dto';
import { CreateBlockRuleDto } from '@/modules/security/blocks/contracts/dto/create-block-rule.dto';
import type { BlockRuleResource } from '@/modules/security/blocks/contracts/resources';
import { SecurityService } from '@/modules/security/blocks/services/security.service';

/** Reglas de bloqueo: solo administradores (con 2FA). */
@AdminGroup()
@ApiTags('admin / bloqueos')
@Controller()
export class BlocksController {
  constructor(private readonly securityService: SecurityService) {}

  @Get()
  list(): Promise<BlockRuleResource[]> {
    return this.securityService.listRules();
  }

  @RecentTwoFactor()
  @Audit('security.block.create', 'BlockRule')
  @Post()
  create(@Body() dto: CreateBlockRuleDto, @CurrentUser() user: AuthUserContext): Promise<BlockRuleResource> {
    return this.securityService.createRule(dto, user.id);
  }

  /** Bloquea la IP de un evento del visor de auditoria con un clic (no deja bloquear la IP del propio admin). */
  @RecentTwoFactor()
  @Audit('security.block.create', 'BlockRule')
  @Post('from-log')
  blockFromLog(@Body() dto: BlockIpFromLogDto, @CurrentUser() user: AuthUserContext, @ClientIp() ip: string): Promise<BlockRuleResource> {
    return this.securityService.blockIpFromLog(dto, user.id, ip);
  }

  /** Devuelve la regla que se quito. */
  @RecentTwoFactor()
  @Audit('security.block.delete', 'BlockRule')
  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string): Promise<BlockRuleResource> {
    return this.securityService.removeRule(id);
  }
}
