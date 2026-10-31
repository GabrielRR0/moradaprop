/** Una foto de la propiedad, con la URL de cada tamaño. */
export interface PropertyImageResource {
  id: string;
  isCover: boolean;
  position: number;
  thumb: string;
  medium: string;
  hd: string;
}
