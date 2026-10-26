import type { Routes } from '@nestjs/core';
import { AccessRiskAdminModule } from './access-risk';
import { BlocksModule } from './blocks';
import { ThreatModelModule } from './threat-model';

/**
 * Rutas admin de la seguridad (se montan bajo /api/admin): /security (bloqueos), /security/threat-model y
 * /security/access-risk. Las rutas de usuario del riesgo de login estan en `accessRiskRoutes` (bajo /api/auth).
 */
export const securityRoutes: Routes = [
  {
    path: 'security',
    module: BlocksModule,
    children: [
      { path: 'threat-model', module: ThreatModelModule },
      { path: 'access-risk', module: AccessRiskAdminModule },
    ],
  },
];
