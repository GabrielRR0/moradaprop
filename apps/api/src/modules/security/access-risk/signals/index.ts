import type { RiskSignal } from '../types';
import { confirmedDevice } from './confirmed-device';
import { impossibleTravel } from './impossible-travel';
import { newCountry } from './new-country';
import { newNetwork } from './new-network';
import { recentFailures } from './recent-failures';
import { unconfirmedDevice } from './unconfirmed-device';

/**
 * LISTA DE SENALES. Agregar una: crea su archivo en esta carpeta, pon sus puntos en policy.ts y sumala aqui.
 * Quitar una: borra su linea (y su archivo).
 */
export const SIGNALS: readonly RiskSignal[] = [
  newCountry,
  newNetwork,
  unconfirmedDevice,
  impossibleTravel,
  recentFailures,
  confirmedDevice,
];
