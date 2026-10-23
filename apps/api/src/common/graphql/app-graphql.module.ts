import { ApolloDriver, type ApolloDriverConfig } from '@nestjs/apollo';
import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { AppConfig } from '../../config';
import { depthRule } from './graphql-limits';

/**
 * Motor GraphQL (Apollo). Code-first: el esquema se arma desde los tipos de cada modulo.
 * Seguridad: limite de profundidad, introspeccion/playground apagados en produccion,
 * sin trazas de error hacia afuera, y la peticion Express viaja en el contexto para que
 * los guards globales (origen, bloqueos, JWT, roles, rate limit) protejan tambien esta puerta.
 */
@Module({
  imports: [
    GraphQLModule.forRootAsync<ApolloDriverConfig>({
      driver: ApolloDriver,
      inject: [AppConfig],
      useFactory: (config: AppConfig) => ({
        path: '/api/graphql',
        autoSchemaFile: true, // esquema en memoria, sin archivo generado
        sortSchema: true,
        introspection: !config.app.isProduction,
        playground: false,
        csrfPrevention: true,
        includeStacktraceInErrorResponses: false,
        validationRules: [depthRule],
        context: ({ req, res }: { req: unknown; res: unknown }) => ({ req, res }),
      }),
    }),
  ],
})
export class AppGraphqlModule {}
