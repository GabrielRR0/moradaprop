/** Opciones para `navigator.credentials.create()` (registrar una passkey). */
export interface PasskeyRegistrationOptionsResource {
  rp: { id: string; name: string };
  user: { id: string; name: string; displayName: string };
  challenge: string;
  pubKeyCredParams: Array<{ type: string; alg: number }>;
  timeout: number;
  attestation: string;
  excludeCredentials: Array<{ type: string; id: string }>;
  authenticatorSelection: { residentKey: string; requireResidentKey: boolean; userVerification: string };
}

/** Opciones para `navigator.credentials.get()` (entrar o dar el segundo paso con una passkey). */
export interface PasskeyAuthenticationOptionsResource {
  challenge: string;
  rpId: string;
  timeout: number;
  userVerification: string;
  allowCredentials: Array<{ type: string; id: string }>;
}
