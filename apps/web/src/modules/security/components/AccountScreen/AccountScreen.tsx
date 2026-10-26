'use client';

import { SecurityShell } from '../shared/SecurityShell';
import { AccountActionsCard } from './AccountActionsCard';
import { DevicesCard } from './DevicesCard';
import { EventsCard } from './EventsCard';
import { FactorStatusCard } from './FactorStatusCard';
import { PasskeysCard } from './PasskeysCard';
import { SessionsCard } from './SessionsCard';
import { TotpCard } from './TotpCard';

/** "Seguridad de la cuenta": todo en una pantalla. Cada tarjeta carga su propia lista. */
export function AccountScreen() {
  return (
    <SecurityShell backHref="/">
      <div className="sc-hero">
        <h1>Seguridad de la cuenta</h1>
        <p>Controla cómo entras, desde dónde y qué está pasando en tu cuenta.</p>
      </div>
      <FactorStatusCard index={1} />
      <PasskeysCard index={2} />
      <TotpCard index={3} />
      <DevicesCard index={4} />
      <SessionsCard index={5} />
      <EventsCard index={6} />
      <AccountActionsCard index={7} />
    </SecurityShell>
  );
}
