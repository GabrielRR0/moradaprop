/** Algoritmos de firma que aceptamos (identificadores COSE). Windows Hello usa a menudo RS256. */
export const COSE_ALG = { ES256: -7, RS256: -257, EdDSA: -8 } as const;
export const SUPPORTED_ALGORITHMS: readonly number[] = [COSE_ALG.ES256, COSE_ALG.RS256, COSE_ALG.EdDSA];

/** Por que se rechazo una passkey. Va a auditoria; al cliente solo se le dice "Passkey invalida". */
export type WebAuthnFailure =
  | 'bad-encoding'
  | 'bad-client-data'
  | 'bad-type'
  | 'bad-challenge'
  | 'bad-origin'
  | 'cross-origin'
  | 'bad-rp-id'
  | 'user-not-present'
  | 'user-not-verified'
  | 'bad-attestation'
  | 'bad-credential'
  | 'unsupported-algorithm'
  | 'bad-public-key'
  | 'bad-signature'
  | 'bad-user-handle'
  | 'unknown-credential'
  | 'credential-cloned'
  | 'too-many-credentials';

export class WebAuthnError extends Error {
  constructor(
    readonly reason: WebAuthnFailure,
    detail?: string,
  ) {
    super(detail ? `${reason}: ${detail}` : reason);
    this.name = 'WebAuthnError';
  }
}

/** El sitio al que quedan atadas las passkeys y los origenes desde los que se aceptan. */
export interface RelyingParty {
  id: string;
  origins: readonly string[];
}

/** Lo que manda el navegador al registrar (formato JSON de `PublicKeyCredential.toJSON()`). */
export interface RegistrationResponseJSON {
  id: string;
  rawId: string;
  type: string;
  response: {
    clientDataJSON: string;
    attestationObject: string;
    transports?: string[];
  };
}

/** Lo que manda el navegador al usar una passkey. */
export interface AuthenticationResponseJSON {
  id: string;
  rawId: string;
  type: string;
  response: {
    clientDataJSON: string;
    authenticatorData: string;
    signature: string;
    userHandle?: string | null;
  };
}

/** Passkey verificada al registrar, lista para guardar. */
export interface VerifiedRegistration {
  /** base64url del id de la credencial */
  credentialId: string;
  /** clave publica COSE (bytes), tal como la entrego el autenticador */
  publicKey: Buffer;
  algorithm: number;
  signCount: number;
  backedUp: boolean;
  transports: string[];
}

/** Passkey verificada al usar. */
export interface VerifiedAuthentication {
  signCount: number;
  backedUp: boolean;
  userHandle: Buffer | null;
}
