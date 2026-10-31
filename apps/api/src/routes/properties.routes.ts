import type { Routes } from '@nestjs/core';
import { PropertiesModule } from '@/modules/properties';

export const propertiesRoutes: Routes = [{ path: 'properties', module: PropertiesModule }];
