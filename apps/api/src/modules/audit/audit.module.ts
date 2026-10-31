import { Global, Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { AuditController } from './controllers/private/admin/audit.controller';
import { AuditInterceptor } from './interceptors/audit.interceptor';
import { AuditRetentionService } from './services/audit-retention.service';
import { AuditService } from './services/audit.service';

@Global()
@Module({
  controllers: [AuditController],
  providers: [AuditService, AuditRetentionService, { provide: APP_INTERCEPTOR, useClass: AuditInterceptor }],
  exports: [AuditService],
})
export class AuditModule {}
