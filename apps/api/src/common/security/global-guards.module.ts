import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerStorageRedisService } from '@nest-lab/throttler-storage-redis';
import { ThrottlerModule } from '@nestjs/throttler';
import { AppConfig } from '../../config';
import { AuthModule, JwtAuthGuard } from '../../modules/auth';
import { BlockGuard, SecondFactorGuard, SecurityModule } from '../../modules/security';
import { AppThrottlerGuard } from './app-throttler.guard';
import { AppOriginGuard } from './guards/app-origin.guard';
import { RolesGuard } from './guards/roles.guard';

/**
 * Cadena de guards que se ejecuta en TODAS las rutas, en este orden:
 *   1. AppOriginGuard - solo nuestras apps (origen + clave de cliente)
 *   2. BlockGuard     - IPs, rangos y paises bloqueados
 *   3. ThrottlerGuard - rate limit (los limites por grupo salen de groups/index.ts)
 *   4. JwtAuthGuard   - exige token salvo en rutas @Public
 *   5. RolesGuard     - @Roles y @RequireTwoFactor
 *   6. SecondFactorGuard - quien debe activar passkey o 2FA y no lo hizo, solo usa las rutas de enrolamiento
 *
 * Agregar un middleware nuevo: crear su guard y sumarlo aqui en la posicion que corresponda.
 */
@Module({
  imports: [
    ThrottlerModule.forRootAsync({
      inject: [AppConfig],
      useFactory: (config: AppConfig) => ({
        throttlers: [{ ttl: 60_000, limit: 100 }],
        // Con Redis el contador es UNO para todos los servidores; en memoria cada servidor cuenta aparte.
        storage: config.cache.driver === 'redis' ? new ThrottlerStorageRedisService(config.database.redisUrl) : undefined,
      }),
    }),
    SecurityModule,
    AuthModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: AppOriginGuard },
    { provide: APP_GUARD, useExisting: BlockGuard },
    { provide: APP_GUARD, useClass: AppThrottlerGuard },
    { provide: APP_GUARD, useExisting: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    { provide: APP_GUARD, useExisting: SecondFactorGuard },
  ],
})
export class GlobalGuardsModule {}
