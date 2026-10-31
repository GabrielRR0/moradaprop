import type { SecondFactorStatusResource } from './contracts/resources';

export type SecondFactorMode = 'off' | 'monitor' | 'enforce';

/** Estado del segundo factor de una cuenta (su forma esta en contracts/resources). */
export type SecondFactorStatus = SecondFactorStatusResource;
