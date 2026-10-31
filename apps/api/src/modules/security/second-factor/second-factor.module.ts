import { Module } from '@nestjs/common';
import { PasskeysModule } from '@/modules/security/passkeys';
import { RecentTwoFactorGuard } from './guards/recent-two-factor.guard';
import { SecondFactorGuard } from './guards/second-factor.guard';
import { SecondFactorController } from './controllers/private/user/second-factor.controller';
import { SecondFactorService } from './services/second-factor.service';

@Module({
  imports: [PasskeysModule],
  controllers: [SecondFactorController],
  providers: [SecondFactorService, SecondFactorGuard, RecentTwoFactorGuard],
  exports: [SecondFactorService, SecondFactorGuard, RecentTwoFactorGuard],
})
export class SecondFactorModule {}
