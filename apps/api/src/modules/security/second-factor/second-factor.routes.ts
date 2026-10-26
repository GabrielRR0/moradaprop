import type { Routes } from '@nestjs/core';
import { SecondFactorModule } from './second-factor.module';

/** Estado del segundo factor del usuario: se monta bajo /api/auth (/auth/second-factor). */
export const secondFactorRoutes: Routes = [{ path: 'auth', module: SecondFactorModule }];
