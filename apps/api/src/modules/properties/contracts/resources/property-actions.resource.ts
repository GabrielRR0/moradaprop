/** Respuestas cortas de las acciones sobre favoritos y fotos. */

/** Favorito agregado (true) o quitado (false). */
export interface FavoriteResource {
  favorite: boolean;
}

/** Resultado de subir fotos. */
export interface ImagesUploadedResource {
  /** Fotos recibidas en esta subida. */
  uploaded: number;
  /** Fotos que tiene la propiedad ahora. */
  total: number;
}

/** Foto que quedó como portada. */
export interface CoverResource {
  coverImageId: string;
}
