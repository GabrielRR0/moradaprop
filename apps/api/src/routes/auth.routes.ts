import type { Routes } from '@nestjs/core';
import { AuthModule } from '../modules/auth';

export const authRoutes: Routes = [{ path: 'auth', module: AuthModule }];
