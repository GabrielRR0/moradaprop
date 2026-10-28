'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { Icon } from '@/components/icons';
import { toast } from '@/lib/toast';
import { useSession } from '@/modules/auth';
import type { SecurityEvent } from '@/lib/api-types';
import { describeEvent } from '../services/event-copy';
import { securityService } from '../services/security.service';
import './shared/security.css';
import { MotionSupport } from '@/support/motion';

/** Solo se avisa de eventos recientes si es la primera vez que este navegador ve la lista. */
const FRESH_MS = 10 * 60_000;

const storageKey = (userId: string) => `sec:last-event:${userId}`;

function readLast(userId: string): string | null {
  try {
    return localStorage.getItem(storageKey(userId));
  } catch {
    return null;
  }
}

function writeLast(userId: string, id: string) {
  try {
    localStorage.setItem(storageKey(userId), id);
  } catch {
    /* sin almacenamiento: se vuelve a avisar en la proxima visita */
  }
}

/**
 * Despues de iniciar sesion mira el historial y avisa del aviso NUEVO mas reciente
 * (docs/FRONTEND-SEGURIDAD.md, seccion 9): informativo -> toast; alerta -> aviso flotante con "Revisar".
 */
export function SecurityWatcher() {
  const { status, user } = useSession();
  const pathname = usePathname();
  const checkedFor = useRef<string | null>(null);
  const [alert, setAlert] = useState<{ text: string } | null>(null);
  const userId = user?.id;

  useEffect(() => {
    if (status !== 'authed' || !userId || checkedFor.current === userId) return;
    checkedFor.current = userId;
    securityService
      .events()
      .then((events: SecurityEvent[]) => {
        const newest = events[0];
        if (!newest) return;
        const last = readLast(userId);
        writeLast(userId, newest.id);
        const unseen = last ? newest.id !== last : Date.now() - new Date(newest.at).getTime() < FRESH_MS;
        if (!unseen) return;
        const copy = describeEvent(newest);
        if (copy.severity === 'alert') setAlert({ text: copy.text });
        else toast(copy.text, 'info');
      })
      .catch(() => undefined); // los avisos son un extra: si fallan no se interrumpe nada
  }, [status, userId]);

  useEffect(() => {
    if (status !== 'authed') {
      setAlert(null);
      checkedFor.current = null;
    }
  }, [status]);

  const show = alert !== null && !pathname.startsWith('/seguridad');
  return (
    <MotionSupport.AnimatePresence>
      {show && (
        <MotionSupport.motion.div
          className="sc-float ui-font"
          style={{ top: 'auto', bottom: 16 }}
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 40 }}
          transition={{ type: 'spring', stiffness: 380, damping: 32 }}
          role="alert"
        >
          <div className="card alert">
            <span className="ico">
              <Icon name="alert" size={20} />
            </span>
            <span className="msg">
              <b>Aviso de seguridad</b>
              {alert?.text}
            </span>
            <Link href="/seguridad" onClick={() => setAlert(null)}>
              Revisar
            </Link>
            <button type="button" className="x" onClick={() => setAlert(null)} aria-label="Cerrar aviso">
              <Icon name="close" size={16} />
            </button>
          </div>
        </MotionSupport.motion.div>
      )}
    </MotionSupport.AnimatePresence>
  );
}
