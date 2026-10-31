/** Estado del servicio. */
export interface HealthResource {
  status: 'ok';
  app: string;
  environment: string;
  /** Hora del servidor en formato ISO. */
  timestamp: string;
}
