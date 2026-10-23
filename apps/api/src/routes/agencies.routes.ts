import type { Routes } from '@nestjs/core';
import { AgenciesModule } from '../modules/agencies';

export const agenciesRoutes: Routes = [{ path: 'agencies', module: AgenciesModule }];
