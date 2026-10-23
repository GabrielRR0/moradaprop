import { Header } from '@nestjs/common';
import { CACHE_POLICIES, cacheControlOf, type CachePolicyName } from './cache-policies';

/**
 * Permite que el navegador o un CDN guarde la respuesta de esta ruta segun la politica indicada.
 * Usalo SOLO en rutas cuya respuesta es igual para todos los usuarios (nunca en datos personales).
 *
 *   @HttpCache('map')
 *   @Get('map')
 *   map() { ... }
 */
export const HttpCache = (policy: CachePolicyName) => Header('Cache-Control', cacheControlOf(CACHE_POLICIES[policy]));
