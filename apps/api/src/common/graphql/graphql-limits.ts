import depthLimit from 'graphql-depth-limit';

/** Niveles maximos de anidacion de una consulta. Evita consultas recursivas que tumben el servidor. */
export const GRAPHQL_MAX_DEPTH = 6;

/** Regla de validacion lista para Apollo (la introspeccion queda fuera del conteo por diseno de la libreria). */
export const depthRule = depthLimit(GRAPHQL_MAX_DEPTH);
