import type { Routes } from '@nestjs/core';
import { AdminUsersModule } from '../modules/admin-users';
import { AuditModule } from '../modules/audit';
import { SecurityModule } from '../modules/security';

/** Grupo /api/admin: todo exige rol ADMIN con 2FA (AdminGroup en cada controller). */
export const adminRoutes: Routes = [
  {
    path: 'admin',
    children: [
      { path: 'security', module: SecurityModule },
      { path: 'audit', module: AuditModule },
      { path: 'users', module: AdminUsersModule },
    ],
  },
];
