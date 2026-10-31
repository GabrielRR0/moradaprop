import { Module } from '@nestjs/common';
import { BlocksModule } from '@/modules/security/blocks';
import { FILE_CHECKS } from './file-checks';
import { SHIELDS } from './shields';
import { ThreatLedgerService } from './services/threat-ledger.service';
import { ThreatModelService, THREAT_FILE_CHECKS, THREAT_SHIELDS } from './services/threat-model.service';
import { ThreatResponseService } from './services/threat-response.service';
import { ThreatModelController } from './controllers/private/admin/threat-model.controller';

@Module({
  imports: [BlocksModule],
  controllers: [ThreatModelController],
  providers: [
    ThreatModelService,
    ThreatLedgerService,
    ThreatResponseService,
    { provide: THREAT_SHIELDS, useValue: SHIELDS },
    { provide: THREAT_FILE_CHECKS, useValue: FILE_CHECKS },
  ],
  exports: [ThreatModelService],
})
export class ThreatModelModule {}
