'use client';

import { AnimatePresence } from 'motion/react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import type { TrustedDevice } from '@/lib/api-types';
import { toast } from '@/lib/toast';
import { endSession } from '@/modules/auth';
import { securityKeys, useDevices, useRefreshing } from '../../hooks/useSecurityData';
import { timeAgo } from '../../services/event-copy';
import { securityService } from '../../services/security.service';
import { Card, ConfirmSheet, ListState } from '../shared/Card';
import { DeviceRow } from './DeviceRow';

/** Dispositivos de confianza. Quitar uno cierra sus sesiones; si es el actual, termina la sesion. */
export function DevicesCard({ index }: { index: number }) {
  const router = useRouter();
  const query = useDevices();
  const [removing, setRemoving] = useState<TrustedDevice | null>(null);
  const remove = useRefreshing(securityService.removeDevice, securityKeys.devices);
  const items = query.data ?? [];

  return (
    <Card
      index={index}
      title="Dispositivos de confianza"
      lead="Desde estos equipos puedes entrar y cambiar tus métodos de seguridad sin pasos extra."
    >
      <ListState
        loading={query.isLoading}
        error={query.isError}
        onRetry={() => query.refetch()}
        empty={items.length === 0 ? 'No hay dispositivos registrados.' : undefined}
      >
        <ul className="sc-list">
          <AnimatePresence initial={false}>
            {items.map((device) => (
              <DeviceRow
                key={device.id}
                icon="monitor"
                title={device.label || 'Dispositivo'}
                meta={`${device.lastCountry ? `${device.lastCountry} · ` : ''}Visto ${timeAgo(device.lastSeenAt)}`}
                current={device.current}
                tag={device.confirmed ? undefined : 'Sin confirmar'}
                removeLabel="Quitar"
                onRemove={() => setRemoving(device)}
              />
            ))}
          </AnimatePresence>
        </ul>
      </ListState>
      <ConfirmSheet
        open={Boolean(removing)}
        onClose={() => setRemoving(null)}
        title="¿Quitar este dispositivo?"
        text={
          removing?.current
            ? 'Es el dispositivo que estás usando: se cerrará tu sesión ahora mismo.'
            : 'Se cerrarán todas sus sesiones y tendrá que verificarse de nuevo.'
        }
        confirmLabel="Quitar"
        danger
        onConfirm={async () => {
          if (!removing) return;
          const wasCurrent = removing.current;
          await remove.mutateAsync(removing.id);
          toast('Dispositivo quitado');
          if (wasCurrent) {
            endSession(true);
            router.replace('/ingresar');
          }
        }}
      />
    </Card>
  );
}
