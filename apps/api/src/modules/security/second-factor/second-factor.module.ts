import { Module } from '@nestjs/common';
import { PasskeysModule } from '../passkeys';
import { SecondFactorGuard } from './guards/second-factor.guard';
import { SecondFactorController } from './second-factor.controller';
import { SecondFactorService } from './services/second-factor.service';

@Module({
  imports: [PasskeysModule],
  controllers: [SecondFactorController],
  providers: [SecondFactorService, SecondFactorGuard],
  exports: [SecondFactorService, SecondFactorGuard],
})
export class SecondFactorModule {}
