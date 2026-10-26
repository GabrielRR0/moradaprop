/** Valores de las passkeys en un solo lugar. */
export const PASSKEY_POLICY = {
  /** Cuanto vive un desafio. El navegador tambien lo usa como tiempo maximo para que el usuario acerque el dedo. */
  challengeTtlSeconds: 300,
  /** Maximo de passkeys activas por usuario (celular, laptop, llave fisica...). */
  maxPerUser: 10,
  labelMaxLength: 60,
  defaultLabel: 'Passkey',
} as const;
