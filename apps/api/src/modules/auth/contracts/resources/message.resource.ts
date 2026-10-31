/** Respuesta con solo un mensaje. Las rutas que no deben revelar si un correo existe responden siempre lo mismo. */
export interface MessageResource {
  message: string;
}
