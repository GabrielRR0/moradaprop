/** Un aviso del historial de seguridad del usuario (inicio de sesion raro, bloqueo, dispositivo...). */
export interface SecurityEventResource {
  id: string;
  at: Date;
  /** Codigo del evento, por ejemplo `risk.assessed`. */
  type: string;
  /** Titulo para mostrar. */
  title: string;
  level: string | null;
  country: string | null;
  device: string | null;
  /** Motivos que llevaron al aviso. */
  details: string[];
}

export interface SecurityEventListResource {
  items: SecurityEventResource[];
}
