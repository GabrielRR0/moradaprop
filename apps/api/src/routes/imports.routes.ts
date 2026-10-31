import type { Routes } from '@nestjs/core';
import { ImportsModule } from '@/modules/imports';

export const importsRoutes: Routes = [{ path: 'imports', module: ImportsModule }];
