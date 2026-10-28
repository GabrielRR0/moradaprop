import { timingSafeEqual } from 'node:crypto';
import { BadRequestException, ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { AppConfig } from '../../../../config';
import { AuditService } from '../../../audit';
import { BlindIndexService } from '../../encryption';
import { PASSKEY_POLICY } from '../policy';
import { fromBase64url, stripPadding, toBase64url } from '../webauthn/base64url';
import { WebAuthnError, SUPPORTED_ALGORITHMS, type AuthenticationResponseJSON, type RegistrationResponseJSON, type RelyingParty } from '../webauthn/types';
import { parseClientData, verifyAuthenticationResponse, verifyRegistrationResponse } from '../webauthn/verify';
import { PasskeyChallengeService } from './passkey-challenge.service';
import { PasskeyCredentialService } from './passkey-credential.service';
import { DbSupport } from '../../../../support/db';

export interface PasskeyUser {
  id: string;
  email: string;
  name: string;
}

/** De donde viene la peticion (para la auditoria). */
export interface PasskeyContext {
  ip?: string;
  userAgent?: string;
}

/**
 * Fachada de las passkeys (WebAuthn). Emite los desafios y las opciones que el navegador pasa al sistema operativo
 * (huella, Face ID, Windows Hello...), y verifica lo que vuelve. Aqui no hay sesiones ni login: quien llama
 * (auth o el controller de gestion) decide que hacer con el usuario verificado.
 */
@Injectable()
export class PasskeyService {
  constructor(
    private readonly config: AppConfig,
    private readonly challenges: PasskeyChallengeService,
    private readonly credentials: PasskeyCredentialService,
    private readonly audit: AuditService,
    private readonly index: BlindIndexService,
  ) {}

  private get rp(): RelyingParty {
    const { rpId, origins } = this.config.security.webauthn;
    return { id: rpId, origins };
  }

  /** Identificador opaco y estable del usuario para el autenticador (HMAC): ni su id real ni datos personales. */
  userHandle(userId: string): Buffer {
    return Buffer.from(this.index.hash('Passkey.userHandle', userId), 'hex');
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

  /** Opciones para `navigator.credentials.create()`. La passkey queda "descubrible" (sirve para entrar sin escribir el correo). */
  async registrationOptions(user: PasskeyUser) {
    if ((await this.credentials.count(user.id)) >= PASSKEY_POLICY.maxPerUser) {
      throw new ConflictException('Ya tienes el maximo de passkeys; quita una para agregar otra');
    }
    const challenge = await this.challenges.issue('REGISTER', user.id);
    const existing = await this.credentials.credentialIds(user.id);
    return {
      rp: { id: this.rp.id, name: this.config.app.name },
      user: { id: toBase64url(this.userHandle(user.id)), name: user.email, displayName: user.name },
      challenge,
      pubKeyCredParams: SUPPORTED_ALGORITHMS.map((alg) => ({ type: 'public-key', alg })),
      timeout: PASSKEY_POLICY.challengeTtlSeconds * 1000,
      attestation: 'none',
      excludeCredentials: existing.map((id) => ({ type: 'public-key', id })),
      authenticatorSelection: { residentKey: 'required', requireResidentKey: true, userVerification: 'required' },
    };
  }

  async verifyRegistration(user: Pick<PasskeyUser, 'id'>, response: RegistrationResponseJSON, label: string | undefined, context: PasskeyContext) {
    try {
      const { data } = parseClientData(response.response.clientDataJSON);
      await this.challenges.consume(data.challenge, 'REGISTER', user.id);
      const verified = verifyRegistrationResponse({ response, expectedChallenge: data.challenge, rp: this.rp });
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
        await this.auditFailure(error, 'register', user.id, context);
        if (error.reason === 'too-many-credentials') throw new ConflictException('Ya tienes el maximo de passkeys; quita una para agregar otra');
        throw new BadRequestException('No se pudo registrar la passkey');
      }
      throw error;
    }
  }

  // ---------------- Uso ----------------

  /**
   * Opciones para `navigator.credentials.get()`. LOGIN: sin lista de credenciales (el dispositivo ofrece las
   * suyas; no hace falta escribir el correo). STEP_UP: solo las passkeys de ese usuario.
   */
  async authenticationOptions(kind: Extract<DbSupport.PasskeyChallengeKind, 'LOGIN' | 'STEP_UP'>, userId?: string) {
    const allowed = userId ? await this.credentials.credentialIds(userId) : [];
    if (kind === 'STEP_UP' && allowed.length === 0) throw new BadRequestException('Esta cuenta no tiene passkeys');
    const challenge = await this.challenges.issue(kind, userId);
    return {
      challenge,
      rpId: this.rp.id,
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
        rp: this.rp,
        credential: { publicKey: Buffer.from(credential.publicKey, 'base64url'), algorithm: credential.algorithm },
      });

      // El dueño que dice el autenticador debe ser el dueño que tenemos guardado.
      const handle = this.userHandle(credential.userId);
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
