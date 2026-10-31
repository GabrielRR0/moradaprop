import { Module } from '@nestjs/common';
import { UsersController } from './controllers/private/user/users.controller';
import { ChangePasswordService } from './services/change-password.service';
import { ProfileService } from './services/profile.service';
import { UsersService } from './services/users.service';

@Module({
  controllers: [UsersController],
  providers: [UsersService, ProfileService, ChangePasswordService],
  exports: [UsersService],
})
export class UsersModule {}
