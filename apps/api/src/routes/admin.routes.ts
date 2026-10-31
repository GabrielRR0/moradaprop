import type { Routes } from '@nestjs/core';
import { AdminUsersModule } from '@/modules/admin-users';
import { AuditModule } from '@/modules/audit';
import { securityRoutes } from '@/modules/security';

/** Grupo /api/admin: todo exige rol ADMIN con 2FA (AdminGroup en cada controller). */
export const adminRoutes: Routes = [
  {
    path: 'admin',
    children: [
      ...securityRoutes, // /security (bloqueos) y /security/threat-model
      { path: 'audit', module: AuditModule },
      { path: 'users', module: AdminUsersModule },
    ],
  },
];
