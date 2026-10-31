/** Un ajuste de la plataforma tal como lo ve el admin. Un secreto nunca sale completo. */
export interface SettingResource {
  key: string;
  label: string;
  secret: boolean;
  /** Hay un valor guardado. */
  configured: boolean;
  /** El valor, solo si NO es secreto. */
  value: string | null;
  /** Un secreto enmascarado ("re_••••a1b2"). */
  preview: string | null;
  updatedAt: string | null;
}
