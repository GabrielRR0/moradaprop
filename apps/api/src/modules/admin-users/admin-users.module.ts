import { Module } from '@nestjs/common';
import { SecurityModule } from '@/modules/security';
import { AdminUsersController } from './controllers/private/admin/admin-users.controller';
import { AdminUsersService } from './services/admin-users.service';

@Module({
  imports: [SecurityModule],
  controllers: [AdminUsersController],
  providers: [AdminUsersService],
})
export class AdminUsersModule {}
