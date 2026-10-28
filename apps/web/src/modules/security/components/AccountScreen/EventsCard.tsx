'use client';

import { useState } from 'react';
import { Icon } from '@/components/icons';
import { Button } from '@/components/ui';
import type { SecurityEvent } from '@/lib/api-types';
import { useEvents } from '../../hooks/useSecurityData';
import { describeEvent, timeAgo } from '../../services/event-copy';
import { Card, ListState } from '../shared/Card';
import { NotMeSheet } from './NotMeSheet';
import { MotionSupport } from '@/support/motion';

/** Historial de avisos de seguridad. Los de alerta (rojo) ofrecen "No fui yo". */
export function EventsCard({ index }: { index: number }) {
  const query = useEvents();
  const [notMe, setNotMe] = useState(false);
  const items = (query.data ?? []).slice(0, 12);

  return (
    <Card
      index={index}
      title="Avisos de seguridad"
      lead="Actividad rara en tu cuenta. Nunca mostramos tu IP; los avisos solo viven aquí, no los enviamos por correo."
    >
      <ListState
        loading={query.isLoading}
        error={query.isError}
        onRetry={() => query.refetch()}
        empty={items.length === 0 ? 'Todo tranquilo: no hay avisos.' : undefined}
      >
        <ul className="sc-list">
          {items.map((event: SecurityEvent, position) => {
            const copy = describeEvent(event);
            const alert = copy.severity === 'alert';
            return (
              <MotionSupport.motion.li
                key={event.id}
                className="sc-item"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.03 * position }}
              >
                <span className={alert ? 'ico alert' : 'ico'}>
                  <Icon name={alert ? 'alert' : 'shield'} size={22} />
                </span>
                <span className="txt">
                  <b style={{ fontWeight: alert ? 800 : 600 }}>{copy.text}</b>
                  <span>
                    {timeAgo(event.at)}
                    {event.device ? ` · ${event.device}` : ''}
                    {event.country ? ` · ${event.country}` : ''}
                  </span>
                </span>
                {alert && (
                  <Button variant="secondary" size="sm" onClick={() => setNotMe(true)}>
                    No fui yo
                  </Button>
                )}
              </MotionSupport.motion.li>
            );
          })}
        </ul>
      </ListState>
      <NotMeSheet open={notMe} onClose={() => setNotMe(false)} />
    </Card>
  );
}
