import { Injectable } from '@nestjs/common';
import type { RequestContext } from '../../../common/security/types';
import type { ChangePasswordDto } from '../dto/change-password.dto';
import type { UpdateProfileDto } from '../dto/update-profile.dto';
import { ChangePasswordService } from './change-password.service';
import { ProfileService } from './profile.service';

/** Fachada del modulo: el controller solo habla con este service. */
@Injectable()
export class UsersService {
  constructor(
    private readonly profile: ProfileService,
    private readonly changePassword: ChangePasswordService,
  ) {}

  me(userId: string) {
    return this.profile.me(userId);
  }
  updateProfile(userId: string, dto: UpdateProfileDto, context: RequestContext) {
    return this.profile.update(userId, dto, context);
  }
  becomeOwner(userId: string, context: RequestContext) {
    return this.profile.becomeOwner(userId, context);
  }
  changePasswordFor(userId: string, sessionId: string, dto: ChangePasswordDto, context: RequestContext) {
    return this.changePassword.change(userId, sessionId, dto, context);
  }
}
