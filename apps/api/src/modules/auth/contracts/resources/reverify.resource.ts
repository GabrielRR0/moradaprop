/** Resultado de volver a comprobar el segundo factor. */
export interface ReverifyResource {
  /** Hasta cuando valen las acciones sensibles sin pedirlo otra vez (fecha ISO). */
  validUntil: string;
}
