import type { Routes } from '@nestjs/core';
import { adminApiPrefix } from '@/config';
import { AdminUsersModule } from '@/modules/admin-users';
import { AuditModule } from '@/modules/audit';
import { securityRoutes } from '@/modules/security';
import { SettingsModule } from '@/modules/settings';

/**
 * Grupo /api/<prefijo>: todo exige rol ADMIN con 2FA (AdminGroup en cada controller). El prefijo sale de ADMIN_API_PREFIX
 * (en produccion no puede ser "admin": ver config/production-guard.ts), asi la URL no se adivina.
 */
export const buildAdminRoutes = (prefix: string): Routes => [
  {
    path: prefix,
    children: [
      ...securityRoutes, // /security (bloqueos) y /security/threat-model
      { path: 'audit', module: AuditModule },
      { path: 'users', module: AdminUsersModule },
      { path: 'settings', module: SettingsModule },
    ],
  },
];

export const adminRoutes: Routes = buildAdminRoutes(adminApiPrefix());
