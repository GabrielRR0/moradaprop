import { Module } from '@nestjs/common';
import { AccessRiskAdminModule, AccessRiskModule } from './access-risk';
import { BlocksModule } from './blocks';
import { EncryptionModule } from './encryption';
import { GeoModule } from './geo';
import { OwnershipModule } from './ownership';
import { PasskeysModule } from './passkeys';
import { SecondFactorModule } from './second-factor';
import { ThreatModelModule } from './threat-model';

/**
 * Modulo padre de TODA la seguridad. Cada defensa es un mini modulo privado en su carpeta;
 * el resto de la app solo importa SecurityModule (o lo que exporta index.ts).
 * Agregar un mini modulo: crear su carpeta con <nombre>.module.ts e index.ts y sumarlo aqui.
 */
@Module({
  imports: [AccessRiskModule, AccessRiskAdminModule, BlocksModule, EncryptionModule, GeoModule, OwnershipModule, PasskeysModule, SecondFactorModule, ThreatModelModule],
  exports: [AccessRiskModule, BlocksModule, EncryptionModule, GeoModule, OwnershipModule, PasskeysModule, SecondFactorModule, ThreatModelModule],
})
export class SecurityModule {}
