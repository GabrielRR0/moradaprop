import type { Routes } from '@nestjs/core';
import { adminRoutes } from './admin.routes';
import { agenciesRoutes } from './agencies.routes';
import { appointmentsRoutes } from './appointments.routes';
import { authRoutes } from './auth.routes';
import { healthRoutes } from './health.routes';
import { importsRoutes } from './imports.routes';
import { propertiesRoutes } from './properties.routes';
import { replyTemplatesRoutes } from './reply-templates.routes';
import { usersRoutes } from './users.routes';

/** Grupo /api: aqui se agregan los archivos de rutas de cada modulo. */
export const apiRoutes: Routes = [
  {
    path: 'api',
    children: [...healthRoutes, ...authRoutes, ...usersRoutes, ...propertiesRoutes, ...agenciesRoutes, ...appointmentsRoutes, ...replyTemplatesRoutes, ...importsRoutes, ...adminRoutes],
  },
];
