import { Module } from '@nestjs/common';
import { AgencyMembersController } from './controllers/private/agency/agency-members.controller';
import { MyAgencyController } from './controllers/private/agency/my-agency.controller';
import { AgencyInvitationsController } from './controllers/private/user/agency-invitations.controller';
import { AgenciesService } from './services/agencies.service';
import { AgencyAccessService } from './services/agency-access.service';
import { AgencyMembersService } from './services/agency-members.service';
import { AgencyProfileService } from './services/agency-profile.service';

@Module({
  controllers: [MyAgencyController, AgencyMembersController, AgencyInvitationsController],
  providers: [AgenciesService, AgencyProfileService, AgencyMembersService, AgencyAccessService],
  exports: [AgenciesService],
})
export class AgenciesModule {}
