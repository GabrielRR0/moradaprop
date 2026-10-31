import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AdminGroup } from '@/common/security/groups';
import { QueryAuditDto } from '@/modules/audit/contracts/dto/query-audit.dto';
import type { AuditLogListResource } from '@/modules/audit/contracts/resources';
import { AuditService } from '@/modules/audit/services/audit.service';

/** Visor de auditoria: solo administradores (con 2FA). */
@AdminGroup()
@ApiTags('admin / auditoria')
@Controller()
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  list(@Query() query: QueryAuditDto): Promise<AuditLogListResource> {
    return this.auditService.list(query);
  }
}
