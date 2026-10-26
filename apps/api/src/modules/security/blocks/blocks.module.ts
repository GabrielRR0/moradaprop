import { Module } from '@nestjs/common';
import { BlocksController } from './blocks.controller';
import { BlockGuard } from './guards/block.guard';
import { BlockCheckService } from './services/block-check.service';
import { BlockRuleService } from './services/block-rule.service';
import { SecurityService } from './services/security.service';

@Module({
  controllers: [BlocksController],
  providers: [BlockCheckService, BlockRuleService, SecurityService, BlockGuard],
  exports: [SecurityService, BlockGuard],
})
export class BlocksModule {}
