import { Injectable } from '@nestjs/common';
import { AuditService } from '@/modules/audit';
import { DbSupport } from '@/support/db';
import type { PasskeyAuthenticationOptionsResource, PasskeyRegisteredResource, PasskeyRegistrationOptionsResource } from '../contracts/resources';
import type { PasskeyContext, PasskeyUser } from '../types';
import type { AuthenticationResponseJSON, RegistrationResponseJSON } from '../webauthn/types';
import { PasskeyAuthenticationService } from './authentication/passkey-authentication.service';
import { PasskeyCredentialService } from './credentials/passkey-credential.service';
import { PasskeyRelyingPartyService } from './credentials/passkey-relying-party.service';
import { PasskeyRegistrationService } from './registration/passkey-registration.service';

export type { PasskeyContext, PasskeyUser } from '../types';

/**
 * Fachada de las passkeys (WebAuthn). Emite los desafios y las opciones que el navegador pasa al sistema operativo
 * (huella, Face ID, Windows Hello...), y verifica lo que vuelve. Aqui no hay sesiones ni login: quien llama
 * (auth o el controller de gestion) decide que hacer con el usuario verificado.
 */
@Injectable()
export class PasskeyService {
  constructor(
    private readonly relyingParty: PasskeyRelyingPartyService,
    private readonly credentials: PasskeyCredentialService,
    private readonly registration: PasskeyRegistrationService,
    private readonly authentication: PasskeyAuthenticationService,
    private readonly audit: AuditService,
  ) {}

  userHandle(userId: string): Buffer {
    return this.relyingParty.userHandle(userId);
  }

  hasAny(userId: string): Promise<boolean> {
    return this.credentials.count(userId).then((n) => n > 0);
  }

  list(userId: string) {
    return this.credentials.list(userId);
  }

  rename(userId: string, id: string, label: string) {
    return this.credentials.rename(userId, id, label);
  }

  async revoke(userId: string, id: string, context: PasskeyContext): Promise<boolean> {
    const done = await this.credentials.revoke(userId, id);
    if (done) await this.audit.log({ action: 'risk.passkey.revoked', userId, resource: 'PasskeyCredential', resourceId: id, ip: context.ip, userAgent: context.userAgent });
    return done;
  }

  // ---------------- Registro ----------------

  registrationOptions(user: PasskeyUser): Promise<PasskeyRegistrationOptionsResource> {
    return this.registration.registrationOptions(user);
  }

  verifyRegistration(
    user: Pick<PasskeyUser, 'id'>,
    response: RegistrationResponseJSON,
    label: string | undefined,
    context: PasskeyContext,
  ): Promise<PasskeyRegisteredResource> {
    return this.registration.verifyRegistration(user, response, label, context);
  }

  // ---------------- Uso ----------------

  authenticationOptions(kind: Extract<DbSupport.PasskeyChallengeKind, 'LOGIN' | 'STEP_UP'>, userId?: string): Promise<PasskeyAuthenticationOptionsResource> {
    return this.authentication.authenticationOptions(kind, userId);
  }

  verifyAuthentication(
    response: AuthenticationResponseJSON,
    kind: Extract<DbSupport.PasskeyChallengeKind, 'LOGIN' | 'STEP_UP'>,
    expectedUserId: string | undefined,
    context: PasskeyContext,
  ): Promise<{ userId: string; passkeyId: string }> {
    return this.authentication.verifyAuthentication(response, kind, expectedUserId, context);
  }
}
