/** Una clave que el admin puede cambiar desde la plataforma. */
export interface SettingDefinition {
  label: string;
  /** true = se guarda cifrada y nunca se devuelve completa. */
  secret: boolean;
  /** Devuelve el motivo si el valor no sirve, o null si esta bien. */
  validate: (value: string) => string | null;
}

const EMAIL = /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/;

/**
 * Lista CERRADA de ajustes editables: solo estas claves se pueden guardar. Para permitir un ajuste nuevo se agrega aqui
 * (y el codigo que lo usa lo pide con SettingsService.get).
 */
export const SETTING_KEYS = {
  'mail.resendApiKey': {
    label: 'API key de Resend',
    secret: true,
    validate: (value) => (/^re_[A-Za-z0-9_-]{16,200}$/.test(value) ? null : 'La API key de Resend empieza con "re_"'),
  },
  'mail.fromAddress': {
    label: 'Correo remitente',
    secret: false,
    validate: (value) => (EMAIL.test(value) && value.length <= 120 ? null : 'Escribe un correo valido (de un dominio verificado en Resend)'),
  },
  'mail.fromName': {
    label: 'Nombre del remitente',
    secret: false,
    validate: (value) => (value.length >= 1 && value.length <= 60 && !/[<>\r\n"]/.test(value) ? null : 'Entre 1 y 60 caracteres, sin < > comillas ni saltos de linea'),
  },
} satisfies Record<string, SettingDefinition>;

export type SettingKey = keyof typeof SETTING_KEYS;

export const isSettingKey = (key: string): key is SettingKey => Object.hasOwn(SETTING_KEYS, key);
