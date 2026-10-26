import { Module } from '@nestjs/common';
import { AccessRiskModule } from '../access-risk';
import { PasskeysController } from './passkeys.controller';
import { PasskeyChallengeService } from './services/passkey-challenge.service';
import { PasskeyCredentialService } from './services/passkey-credential.service';
import { PasskeyEnrollmentService } from './services/passkey-enrollment.service';
import { PasskeyService } from './services/passkey.service';

@Module({
  imports: [AccessRiskModule],
  controllers: [PasskeysController],
  providers: [PasskeyChallengeService, PasskeyCredentialService, PasskeyService, PasskeyEnrollmentService],
  exports: [PasskeyService],
})
export class PasskeysModule {}
