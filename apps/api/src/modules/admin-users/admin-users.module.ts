import { Module } from '@nestjs/common';
import { SecurityModule } from '../security';
import { AdminUsersController } from './admin-users.controller';
import { AdminUsersService } from './services/admin-users.service';

@Module({
  imports: [SecurityModule],
  controllers: [AdminUsersController],
  providers: [AdminUsersService],
})
export class AdminUsersModule {}
