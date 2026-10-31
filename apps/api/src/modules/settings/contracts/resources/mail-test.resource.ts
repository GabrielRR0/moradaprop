/** Resultado de enviar el correo de prueba con la configuracion actual. */
export interface MailTestResource {
  ok: boolean;
  /** Correo al que se envio la prueba (el del admin que la pidio). */
  to: string;
  /** Motivo del fallo, si lo hubo. */
  error: string | null;
}
