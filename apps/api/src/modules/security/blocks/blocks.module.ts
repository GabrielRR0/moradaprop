import { Module } from '@nestjs/common';
import { GeoModule } from '@/modules/security/geo';
import { BlocksController } from './controllers/private/admin/blocks.controller';
import { BlockGuard } from './guards/block.guard';
import { BlockCheckService } from './services/block-check.service';
import { BlockRuleService } from './services/block-rule.service';
import { SecurityService } from './services/security.service';

@Module({
  imports: [GeoModule],
  controllers: [BlocksController],
  providers: [BlockCheckService, BlockRuleService, SecurityService, BlockGuard],
  exports: [SecurityService, BlockGuard],
})
export class BlocksModule {}
