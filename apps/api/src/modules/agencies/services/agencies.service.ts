import { Injectable } from '@nestjs/common';
import type { RequestContext } from '@/common/security/types';
import type { UpdateAgencyDto } from '../contracts/dto/update-agency.dto';
import type { InvitationAcceptedResource, InvitationSentResource, MyAgencyResource } from '../contracts/resources';
import { AgencyMembersService } from './agency-members.service';
import { AgencyProfileService } from './agency-profile.service';

/** Fachada del modulo. */
@Injectable()
export class AgenciesService {
  constructor(
    private readonly profile: AgencyProfileService,
    private readonly members: AgencyMembersService,
  ) {}

  me(userId: string): Promise<MyAgencyResource> {
    return this.profile.me(userId);
  }
  update(userId: string, dto: UpdateAgencyDto, ctx: RequestContext): Promise<MyAgencyResource> {
    return this.profile.update(userId, dto, ctx);
  }
  invite(adminId: string, email: string, ctx: RequestContext): Promise<InvitationSentResource> {
    return this.members.invite(adminId, email, ctx);
  }
  acceptInvitation(userId: string, token: string, ctx: RequestContext): Promise<InvitationAcceptedResource> {
    return this.members.accept(userId, token, ctx);
  }
  removeMember(adminId: string, memberId: string, ctx: RequestContext) {
    return this.members.remove(adminId, memberId, ctx);
  }
}
