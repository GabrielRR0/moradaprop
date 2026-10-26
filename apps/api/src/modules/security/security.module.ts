import { Module } from '@nestjs/common';
import { BlocksModule } from './blocks';
import { EncryptionModule } from './encryption';
import { OwnershipModule } from './ownership';
import { ThreatModelModule } from './threat-model';

/**
 * Modulo padre de TODA la seguridad. Cada defensa es un mini modulo privado en su carpeta;
 * el resto de la app solo importa SecurityModule (o lo que exporta index.ts).
 * Agregar un mini modulo: crear su carpeta con <nombre>.module.ts e index.ts y sumarlo aqui.
 */
@Module({
  imports: [BlocksModule, EncryptionModule, OwnershipModule, ThreatModelModule],
  exports: [BlocksModule, EncryptionModule, OwnershipModule, ThreatModelModule],
})
export class SecurityModule {}
