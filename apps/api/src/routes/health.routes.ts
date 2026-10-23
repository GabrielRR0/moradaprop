import type { Routes } from '@nestjs/core';
import { HealthModule } from '../modules/health/health.module';

export const healthRoutes: Routes = [{ path: 'health', module: HealthModule }];
