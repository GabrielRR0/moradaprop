import type { Routes } from '@nestjs/core';
import { AccessRiskModule } from './access-risk.module';

/** Rutas de usuario del riesgo de login: se montan bajo /api/auth (devices, security-events). */
export const accessRiskRoutes: Routes = [{ path: 'auth', module: AccessRiskModule }];
