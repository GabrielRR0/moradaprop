import { buildSchema, parse, validate } from 'graphql';
import { describeCase } from '@test/support/describe-case';
import { depthRule, GRAPHQL_MAX_DEPTH } from '../graphql-limits';

// Esquema recursivo minimo: permite anidar sin fin, como pasaria con un tipo que se referencia a si mismo.
const schema = buildSchema('type Nodo { id: ID hijo: Nodo } type Query { nodo: Nodo }');
const anidar = (niveles: number) => `{ nodo ${'{ hijo '.repeat(niveles - 1)}{ id }${' }'.repeat(niveles - 1)} }`;
const errores = (query: string) => validate(schema, parse(query), [depthRule]).map((e) => e.message);

describe('graphql-limits', () => {
  describeCase('common/graphql', {
    que: `acepta consultas de hasta ${GRAPHQL_MAX_DEPTH} niveles y rechaza las mas profundas`,
    espera: `${GRAPHQL_MAX_DEPTH} niveles sin errores; ${GRAPHQL_MAX_DEPTH + 2} niveles con error "maximum operation depth"`,
    ejecutar: () => ({ dentro: errores(anidar(GRAPHQL_MAX_DEPTH)), fuera: errores(anidar(GRAPHQL_MAX_DEPTH + 2)) }),
    verificar: ({ dentro, fuera }) => {
      expect(dentro).toEqual([]);
      expect(fuera[0]).toContain('maximum operation depth');
    },
    describirObtenido: ({ dentro, fuera }) => `dentro del limite: ${dentro.length} errores; fuera: "${fuera[0]}"`,
  });
});
