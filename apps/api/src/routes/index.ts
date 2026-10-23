import type { Routes } from '@nestjs/core';
import { apiRoutes } from './api.routes';

/** Indice de rutas (como routes/web.php + api.php): importa los grupos. */
export const appRoutes: Routes = [...apiRoutes];
