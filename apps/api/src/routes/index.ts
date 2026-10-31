import type { Routes } from '@nestjs/core';
import { apiRoutes } from './api.routes';

/** Indice de rutas : importa los grupos. */
export const appRoutes: Routes = [...apiRoutes];
