import { BadRequestException, ConflictException, Injectable } from '@nestjs/common';
import { AppConfig } from '@/config';
import { AuditService } from '@/modules/audit';
import { DbSupport } from '@/support/db';
import type { PasskeyRegistrationOptionsResource, PasskeyRegisteredResource } from '../../contracts/resources';
import { PASSKEY_POLICY } from '../../policy';
import type { PasskeyContext, PasskeyUser } from '../../types';
import { toBase64url } from '../../webauthn/base64url';
import { WebAuthnError, SUPPORTED_ALGORITHMS, type RegistrationResponseJSON } from '../../webauthn/types';
import { parseClientData, verifyRegistrationResponse } from '../../webauthn/verify';
import { PasskeyChallengeService } from '../credentials/passkey-challenge.service';
import { PasskeyCredentialService } from '../credentials/passkey-credential.service';
import { PasskeyRelyingPartyService } from '../credentials/passkey-relying-party.service';

/** Registrar una passkey nueva: emite las opciones para el navegador y verifica lo que vuelve. */
@Injectable()
export class PasskeyRegistrationService {
  constructor(
    private readonly config: AppConfig,
    private readonly relyingParty: PasskeyRelyingPartyService,
    private readonly challenges: PasskeyChallengeService,
    private readonly credentials: PasskeyCredentialService,
    private readonly audit: AuditService,
  ) {}

  /** Opciones para `navigator.credentials.create()`. La passkey queda "descubrible" (sirve para entrar sin escribir el correo). */
  async registrationOptions(user: PasskeyUser): Promise<PasskeyRegistrationOptionsResource> {
    if ((await this.credentials.count(user.id)) >= PASSKEY_POLICY.maxPerUser) {
      throw new ConflictException('Ya tienes el maximo de passkeys; quita una para agregar otra');
    }
    const challenge = await this.challenges.issue('REGISTER', user.id);
    const existing = await this.credentials.credentialIds(user.id);
    return {
      rp: { id: this.relyingParty.rp.id, name: this.config.app.name },
      user: { id: toBase64url(this.relyingParty.userHandle(user.id)), name: user.email, displayName: user.name },
      challenge,
      pubKeyCredParams: SUPPORTED_ALGORITHMS.map((alg) => ({ type: 'public-key', alg })),
      timeout: PASSKEY_POLICY.challengeTtlSeconds * 1000,
      attestation: 'none',
      excludeCredentials: existing.map((id) => ({ type: 'public-key', id })),
      authenticatorSelection: { residentKey: 'required', requireResidentKey: true, userVerification: 'required' },
    };
  }

  async verifyRegistration(
    user: Pick<PasskeyUser, 'id'>,
    response: RegistrationResponseJSON,
    label: string | undefined,
    context: PasskeyContext,
  ): Promise<PasskeyRegisteredResource> {
    try {
      const { data } = parseClientData(response.response.clientDataJSON);
      await this.challenges.consume(data.challenge, 'REGISTER', user.id);
      const verified = verifyRegistrationResponse({ response, expectedChallenge: data.challenge, rp: this.relyingParty.rp });
      if ((await this.credentials.count(user.id)) >= PASSKEY_POLICY.maxPerUser) throw new WebAuthnError('too-many-credentials');

      const row = await this.credentials.create(user.id, verified, label ?? `${PASSKEY_POLICY.defaultLabel} ${(await this.credentials.count(user.id)) + 1}`);
      await this.audit.log({
        action: 'risk.passkey.registered',
        userId: user.id,
        resource: 'PasskeyCredential',
        resourceId: row.id,
        ip: context.ip,
        userAgent: context.userAgent,
        metadata: { label: row.label, backedUp: row.backedUp, algorithm: row.algorithm },
      });
      return { id: row.id, label: row.label, backedUp: row.backedUp };
    } catch (error) {
      if (error instanceof DbSupport.Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('Esta passkey ya esta registrada');
      }
      if (error instanceof WebAuthnError) {
        await this.auditFailure(error, user.id, context);
        if (error.reason === 'too-many-credentials') throw new ConflictException('Ya tienes el maximo de passkeys; quita una para agregar otra');
        throw new BadRequestException('No se pudo registrar la passkey');
      }
      throw error;
    }
  }

  private auditFailure(error: WebAuthnError, userId: string, context: PasskeyContext) {
    return this.audit.log({
      action: 'risk.passkey.failed',
      userId,
      ip: context.ip,
      userAgent: context.userAgent,
      metadata: { flow: 'register', reason: error.reason },
    });
  }
}
