import type { Routes } from '@nestjs/core';
import { BlocksModule } from './blocks';
import { ThreatModelModule } from './threat-model';

/** Rutas admin de la seguridad (se montan bajo /api/admin): /security (bloqueos) y /security/threat-model. */
export const securityRoutes: Routes = [
  {
    path: 'security',
    module: BlocksModule,
    children: [{ path: 'threat-model', module: ThreatModelModule }],
  },
];
