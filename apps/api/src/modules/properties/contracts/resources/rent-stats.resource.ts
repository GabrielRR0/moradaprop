import type { StateRent } from '../../utils/rent-stats';

/** Alquiler típico por estado, de los más publicados a los menos. */
export interface RentStatsResource {
  states: StateRent[];
}
