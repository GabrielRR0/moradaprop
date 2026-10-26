import type { Routes } from '@nestjs/core';
import { AuthModule } from '../modules/auth';
import { accessRiskRoutes, passkeysRoutes, secondFactorRoutes } from '../modules/security';

/** /api/auth: sesion y 2FA (auth) + dispositivos e historial (security/access-risk) + mis passkeys (security/passkeys). */
export const authRoutes: Routes = [{ path: 'auth', module: AuthModule }, ...accessRiskRoutes, ...passkeysRoutes, ...secondFactorRoutes];
