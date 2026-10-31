/** Datos para conectarse al servidor de correo (SMTP). */
export interface MailConnection {
  host: string;
  port: number;
  user: string;
  password: string;
  /** Remitente ("Nombre <correo>"); si falta se usa MAIL_FROM. */
  from?: string;
}

/**
 * Quien puede reemplazar la configuracion de correo del entorno (por ejemplo, la que el admin guarda en la plataforma).
 * Devuelve null cuando no hay nada guardado: entonces se usan las variables MAIL_*.
 */
export interface MailConfigSource {
  current(): Promise<MailConnection | null>;
}

export const MAIL_CONFIG_SOURCE = 'MAIL_CONFIG_SOURCE';
