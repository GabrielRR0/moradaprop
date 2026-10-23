import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AdminGroup } from '../../common/security/groups';
import { QueryAuditDto } from './dto/query-audit.dto';
import { AuditService } from './services/audit.service';

@ApiTags('admin / auditoria')
@AdminGroup()
@Controller()
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  list(@Query() query: QueryAuditDto) {
    return this.auditService.list(query);
  }
}
