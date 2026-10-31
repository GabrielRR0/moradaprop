import { Module } from '@nestjs/common';
import { AccessRiskModule } from '@/modules/security/access-risk';
import { PasskeysController } from './controllers/private/user/passkeys.controller';
import { PasskeyAuthenticationService } from './services/authentication/passkey-authentication.service';
import { PasskeyChallengeService } from './services/credentials/passkey-challenge.service';
import { PasskeyCredentialService } from './services/credentials/passkey-credential.service';
import { PasskeyRelyingPartyService } from './services/credentials/passkey-relying-party.service';
import { PasskeyService } from './services/passkey.service';
import { PasskeyEnrollmentService } from './services/registration/passkey-enrollment.service';
import { PasskeyRegistrationService } from './services/registration/passkey-registration.service';

@Module({
  imports: [AccessRiskModule],
  controllers: [PasskeysController],
  providers: [
    PasskeyChallengeService,
    PasskeyCredentialService,
    PasskeyRelyingPartyService,
    PasskeyRegistrationService,
    PasskeyAuthenticationService,
    PasskeyService,
    PasskeyEnrollmentService,
  ],
  exports: [PasskeyService],
})
export class PasskeysModule {}
