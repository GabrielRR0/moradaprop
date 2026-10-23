import { Module } from '@nestjs/common';
import { BlockGuard } from './guards/block.guard';
import { SecurityController } from './security.controller';
import { BlockCheckService } from './services/block-check.service';
import { BlockRuleService } from './services/block-rule.service';
import { SecurityService } from './services/security.service';

@Module({
  controllers: [SecurityController],
  providers: [BlockCheckService, BlockRuleService, SecurityService, BlockGuard],
  exports: [SecurityService, BlockGuard],
})
export class SecurityModule {}
