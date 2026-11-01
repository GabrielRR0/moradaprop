/** Estado de la verificación "no soy un robot" (Cloudflare Turnstile), para que la web sepa si debe mostrar el widget. */
export interface HumanCheckResource {
  /** true = registro, login, recuperar contraseña y reenvío de códigos exigen la verificación. */
  enabled: boolean;
  /** Clave pública del widget; null si la verificación está apagada. */
  siteKey: string | null;
}
