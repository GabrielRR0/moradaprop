/** Datos para configurar la app de autenticacion. */
export interface TwoFactorSetupResource {
  secret: string;
  otpauthUrl: string;
  /** Codigo QR como data URL. */
  qrCode: string;
}

/** 2FA activado: los codigos de respaldo se muestran UNA sola vez, y el access token nuevo ya cuenta como verificado. */
export interface TwoFactorEnabledResource {
  backupCodes: string[];
  accessToken: string;
}

/** Codigos de respaldo nuevos (invalidan los anteriores). */
export interface BackupCodesResource {
  backupCodes: string[];
}
