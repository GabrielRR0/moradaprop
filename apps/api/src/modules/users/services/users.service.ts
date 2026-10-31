import { Injectable } from '@nestjs/common';
import type { RequestContext } from '@/common/security/types';
import type { ChangePasswordDto } from '../contracts/dto/change-password.dto';
import type { UpdateProfileDto } from '../contracts/dto/update-profile.dto';
import type { PasswordChangedResource, UserProfileResource } from '../contracts/resources';
import { ChangePasswordService } from './change-password.service';
import { ProfileService } from './profile.service';

/** Fachada del modulo: el controller solo habla con este service. */
@Injectable()
export class UsersService {
  constructor(
    private readonly profile: ProfileService,
    private readonly changePassword: ChangePasswordService,
  ) {}

  me(userId: string): Promise<UserProfileResource> {
    return this.profile.me(userId);
  }
  updateProfile(userId: string, dto: UpdateProfileDto, context: RequestContext): Promise<UserProfileResource> {
    return this.profile.update(userId, dto, context);
  }
  becomeOwner(userId: string, context: RequestContext): Promise<UserProfileResource> {
    return this.profile.becomeOwner(userId, context);
  }
  changePasswordFor(userId: string, sessionId: string, dto: ChangePasswordDto, context: RequestContext): Promise<PasswordChangedResource> {
    return this.changePassword.change(userId, sessionId, dto, context);
  }
}
