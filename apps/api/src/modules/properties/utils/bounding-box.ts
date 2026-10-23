interface Box {
  swLat?: number;
  swLng?: number;
  neLat?: number;
  neLng?: number;
}

/**
 * Ajusta el cuadro del mapa a una cuadricula fija (suroeste hacia abajo, noreste hacia arriba).
 *
 * Por que: dos usuarios que miran casi la misma zona tienen cuadros que difieren en decimales
 * (10.4971 vs 10.4973) y por eso no compartirian cache. Al ajustar a la cuadricula, ambos piden
 * exactamente lo mismo. El cuadro resultante es un poco mayor que el visible, lo cual no estorba:
 * el mapa solo dibuja lo que cae dentro de la pantalla.
 */
export function snapBox<T extends Box>(query: T, zoom: number): T {
  const { swLat, swLng, neLat, neLng } = query;
  if (swLat === undefined || swLng === undefined || neLat === undefined || neLng === undefined) return query;

  const step = 360 / 2 ** zoom / 4; // a mayor zoom, cuadricula mas fina
  const down = (value: number) => Math.floor(value / step) * step;
  const up = (value: number) => Math.ceil(value / step) * step;
  const clean = (value: number) => Number(value.toFixed(6));

  return {
    ...query,
    swLat: clean(down(swLat)),
    swLng: clean(down(swLng)),
    neLat: clean(up(neLat)),
    neLng: clean(up(neLng)),
  };
}
