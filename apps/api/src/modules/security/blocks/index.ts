// Archivo padre del mini modulo: lo unico que sus hermanos dentro de security pueden importar.
export { BlocksModule } from './blocks.module';
export { SecurityService } from './services/security.service';
export { BlockGuard } from './guards/block.guard';
