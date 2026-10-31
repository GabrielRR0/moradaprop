/** Un dispositivo del usuario. `current` marca el que esta haciendo la consulta. */
export interface DeviceResource {
  id: string;
  label: string;
  /** Ya fue confirmado con un segundo factor (o fue la primera entrada de la cuenta). */
  confirmed: boolean;
  firstSeenAt: Date;
  lastSeenAt: Date;
  lastCountry: string | null;
  current: boolean;
}

export interface DeviceListResource {
  items: DeviceResource[];
}
