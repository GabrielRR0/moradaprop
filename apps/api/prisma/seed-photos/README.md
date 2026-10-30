# seed-photos

Fotos reales que usa `prisma/seed.ts` para las propiedades de ejemplo.

## Qué hay

5 juegos de 3 fotos (`<juego>-a|b|c.jpg`, 1600 px de ancho):

- `apto-1`, `apto-2`, `apto-3`: interiores de apartamento (sala, cocina, cuarto, baño).
- `casa-1`, `casa-2`: casa con fachada o piscina más un interior.

## Cómo funciona

El seed procesa cada foto una sola vez (original, thumb, medium y hd) y la copia a cada propiedad con sus propias rutas, igual que hace el API al subir fotos. Los apartamentos, habitaciones, locales y oficinas usan los juegos `apto-*`. Las casas, townhouses, galpones y terrenos usan los `casa-*`. Se alternan entre propiedades, y la primera foto de cada juego es la portada.

Para regenerar las propiedades con las fotos: `pnpm db:seed -- --fresh`.

## Origen

Fotos de Unsplash (licencia Unsplash: uso libre, incluso comercial). Solo para datos de ejemplo en desarrollo.
