import { timingSafeEqual } from 'node:crypto';
import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { AuditService } from '@/modules/audit';
import { DbSupport } from '@/support/db';
import type { PasskeyAuthenticationOptionsResource } from '../../contracts/resources';
import { PASSKEY_POLICY } from '../../policy';
import type { PasskeyContext } from '../../types';
import { fromBase64url, stripPadding } from '../../webauthn/base64url';
import { WebAuthnError, type AuthenticationResponseJSON } from '../../webauthn/types';
import { parseClientData, verifyAuthenticationResponse } from '../../webauthn/verify';
import { PasskeyChallengeService } from '../credentials/passkey-challenge.service';
import { PasskeyCredentialService } from '../credentials/passkey-credential.service';
import { PasskeyRelyingPartyService } from '../credentials/passkey-relying-party.service';

/** Usar una passkey: emite las opciones para `navigator.credentials.get()` y verifica la firma que vuelve. */
@Injectable()
export class PasskeyAuthenticationService {
  constructor(
    private readonly relyingParty: PasskeyRelyingPartyService,
    private readonly challenges: PasskeyChallengeService,
    private readonly credentials: PasskeyCredentialService,
    private readonly audit: AuditService,
  ) {}

  /**
   * Opciones para `navigator.credentials.get()`. LOGIN: sin lista de credenciales (el dispositivo ofrece las
   * suyas; no hace falta escribir el correo). STEP_UP: solo las passkeys de ese usuario.
   */
  async authenticationOptions(
    kind: Extract<DbSupport.PasskeyChallengeKind, 'LOGIN' | 'STEP_UP'>,
    userId?: string,
  ): Promise<PasskeyAuthenticationOptionsResource> {
    const allowed = userId ? await this.credentials.credentialIds(userId) : [];
    if (kind === 'STEP_UP' && allowed.length === 0) throw new BadRequestException('Esta cuenta no tiene passkeys');
    const challenge = await this.challenges.issue(kind, userId);
    return {
      challenge,
      rpId: this.relyingParty.rp.id,
      timeout: PASSKEY_POLICY.challengeTtlSeconds * 1000,
      userVerification: 'required',
      allowCredentials: allowed.map((id) => ({ type: 'public-key', id })),
    };
  }

  /**
   * Verifica el uso de una passkey y devuelve de quien es. `expectedUserId` (STEP_UP) ata el desafio y la passkey a
   * ese usuario. Todo fallo es "Passkey invalida": no se dice cual comprobacion fallo (el motivo va a auditoria).
   */
  async verifyAuthentication(
    response: AuthenticationResponseJSON,
    kind: Extract<DbSupport.PasskeyChallengeKind, 'LOGIN' | 'STEP_UP'>,
    expectedUserId: string | undefined,
    context: PasskeyContext,
  ): Promise<{ userId: string; passkeyId: string }> {
    try {
      fromBase64url(response.id, 1023);
      const { data } = parseClientData(response.response.clientDataJSON);
      await this.challenges.consume(data.challenge, kind, expectedUserId);

      const credential = await this.credentials.findActive(stripPadding(response.id));
      if (!credential || (expectedUserId && credential.userId !== expectedUserId)) throw new WebAuthnError('unknown-credential');

      const verified = verifyAuthenticationResponse({
        response,
        expectedChallenge: data.challenge,
        rp: this.relyingParty.rp,
        credential: { publicKey: Buffer.from(credential.publicKey, 'base64url'), algorithm: credential.algorithm },
      });

      // El dueño que dice el autenticador debe ser el dueño que tenemos guardado.
      const handle = this.relyingParty.userHandle(credential.userId);
      if (verified.userHandle && !(verified.userHandle.length === handle.length && timingSafeEqual(verified.userHandle, handle))) {
        throw new WebAuthnError('bad-user-handle');
      }

      // Contador: debe subir. Si baja o se repite, alguien tiene una copia de la passkey: se revoca. Un contador siempre
      // en 0 es normal en passkeys sincronizadas (iCloud, Google).
      if ((verified.signCount !== 0 || credential.signCount !== 0n) && BigInt(verified.signCount) <= credential.signCount) {
        await this.credentials.revokeById(credential.id);
        await this.audit.log({ action: 'risk.passkey.cloned', userId: credential.userId, resource: 'PasskeyCredential', resourceId: credential.id, ip: context.ip, userAgent: context.userAgent });
        throw new WebAuthnError('credential-cloned');
      }

      await this.credentials.recordUse(credential.id, verified.signCount, verified.backedUp);
      return { userId: credential.userId, passkeyId: credential.id };
    } catch (error) {
      if (error instanceof WebAuthnError) {
        await this.auditFailure(error, kind === 'LOGIN' ? 'login' : 'step-up', expectedUserId, context);
        throw new UnauthorizedException('Passkey invalida');
      }
      throw error;
    }
  }

  private auditFailure(error: WebAuthnError, flow: string, userId: string | undefined, context: PasskeyContext) {
    return this.audit.log({
      action: 'risk.passkey.failed',
      userId,
      ip: context.ip,
      userAgent: context.userAgent,
      metadata: { flow, reason: error.reason },
    });
  }
}
