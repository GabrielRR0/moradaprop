/** Token corto que prueba que la contrasena fue correcta y falta el segundo paso. */
export interface TwoFactorChallengePayload {
  sub: string;
  type: '2fa-challenge';
  /** Riesgo del inicio de sesion que origino el desafio (modules/security/access-risk). */
  risk?: 'LOW' | 'MEDIUM' | 'HIGH';
}
