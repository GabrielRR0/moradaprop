import { Module } from '@nestjs/common';
import { AgenciesController } from './agencies.controller';
import { AgenciesService } from './services/agencies.service';
import { AgencyAccessService } from './services/agency-access.service';
import { AgencyMembersService } from './services/agency-members.service';
import { AgencyProfileService } from './services/agency-profile.service';

@Module({
  controllers: [AgenciesController],
  providers: [AgenciesService, AgencyProfileService, AgencyMembersService, AgencyAccessService],
  exports: [AgenciesService],
})
export class AgenciesModule {}
