/** Campo cifrado, siempre "modelo.campo" (ej. "User.email"). Es el contexto que autentica el cifrado. */
export type EncryptedField = `${string}.${string}`;
