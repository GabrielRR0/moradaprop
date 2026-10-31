import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Audit } from '../../audit';
import { AdminGroup } from '../../../common/security/groups';
import { CurrentUser } from '../../../common/security/decorators';
import type { AuthUserContext } from '../../../common/security/types';
import { CreateBlockRuleDto } from './dto/create-block-rule.dto';
import { SecurityService } from './services/security.service';

@ApiTags('admin / bloqueos')
@AdminGroup()
@Controller()
export class BlocksController {
  constructor(private readonly securityService: SecurityService) {}

  @Get()
  list() {
    return this.securityService.listRules();
  }

  @Post()
  @Audit('security.block.create', 'BlockRule')
  create(@Body() dto: CreateBlockRuleDto, @CurrentUser() user: AuthUserContext) {
    return this.securityService.createRule(dto, user.id);
  }

  @Delete(':id')
  @Audit('security.block.delete', 'BlockRule')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.securityService.removeRule(id);
  }
}
