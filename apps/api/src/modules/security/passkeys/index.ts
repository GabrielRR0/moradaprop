// Archivo padre del mini modulo: lo unico que sus hermanos dentro de security pueden importar.
export { PasskeysModule } from './passkeys.module';
export { passkeysRoutes } from './passkeys.routes';
export { PasskeyService } from './services/passkey.service';
export type { PasskeyAuthenticationOptionsResource } from './contracts/resources';
export { AuthenticationCredentialDto, PasskeyLoginDto, PasskeyStepUpOptionsDto, PasskeyStepUpVerifyDto } from './contracts/dto/passkey.dto';
