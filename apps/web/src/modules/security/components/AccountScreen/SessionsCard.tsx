'use client';

import { AnimatePresence } from 'motion/react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import type { ActiveSession } from '@/lib/api-types';
import { toast } from '@/lib/toast';
import { endSession } from '@/modules/auth';
import { securityKeys, useRefreshing, useSessions } from '../../hooks/useSecurityData';
import { timeAgo } from '../../services/event-copy';
import { securityService } from '../../services/security.service';
import { Card, ConfirmSheet, ListState } from '../shared/Card';
import { DeviceRow, describeAgent } from './DeviceRow';

/** Sesiones abiertas (una por navegador o dispositivo) con boton para cerrar cada una. */
export function SessionsCard({ index }: { index: number }) {
  const router = useRouter();
  const query = useSessions();
  const [closing, setClosing] = useState<ActiveSession | null>(null);
  const close = useRefreshing(securityService.closeSession, securityKeys.sessions);
  const items = query.data ?? [];

  return (
    <Card index={index} title="Sesiones abiertas" lead="Si no reconoces alguna, ciérrala y cambia tu contraseña.">
      <ListState
        loading={query.isLoading}
        error={query.isError}
        onRetry={() => query.refetch()}
        empty={items.length === 0 ? 'No hay sesiones abiertas.' : undefined}
      >
        <ul className="sc-list">
          <AnimatePresence initial={false}>
            {items.map((session) => (
              <DeviceRow
                key={session.id}
                icon={/Android|iPhone|iPad/.test(session.userAgent ?? '') ? 'smartphone' : 'monitor'}
                title={describeAgent(session.userAgent)}
                meta={`Activa ${timeAgo(session.lastUsedAt)}`}
                current={session.current}
                removeLabel="Cerrar"
                onRemove={() => setClosing(session)}
              />
            ))}
          </AnimatePresence>
        </ul>
      </ListState>
      <ConfirmSheet
        open={Boolean(closing)}
        onClose={() => setClosing(null)}
        title="¿Cerrar esta sesión?"
        text={
          closing?.current
            ? 'Es tu sesión actual: tendrás que ingresar otra vez.'
            : 'Quien la esté usando tendrá que ingresar de nuevo.'
        }
        confirmLabel="Cerrar sesión"
        danger
        onConfirm={async () => {
          if (!closing) return;
          const wasCurrent = closing.current;
          await close.mutateAsync(closing.id);
          toast('Sesión cerrada');
          if (wasCurrent) {
            endSession(true);
            router.replace('/ingresar');
          }
        }}
      />
    </Card>
  );
}
