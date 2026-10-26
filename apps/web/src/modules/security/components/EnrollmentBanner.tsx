'use client';

import { AnimatePresence, motion } from 'motion/react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Icon } from '@/components/icons';
import { useSession } from '@/modules/auth';
import { timeLeft } from '../services/deadline';
import './shared/security.css';

const DISMISS_KEY = 'sec:recommend-dismissed';
/** Pantallas donde el aviso estorba (ya estan en el flujo de acceso o de activacion). */
const HIDDEN_ON = ['/ingresar', '/registro', '/recuperar', '/verificar', '/seguridad/activar'];

function readDismissed(): boolean {
  try {
    return localStorage.getItem(DISMISS_KEY) === '1';
  } catch {
    return false;
  }
}

/**
 * Aviso flotante sobre el segundo factor (docs/FRONTEND-SEGURIDAD.md, seccion 8):
 *  - cuenta que DEBE activarlo, con plazo -> aviso persistente con cuenta regresiva
 *  - plazo vencido pero el servidor aun no bloquea (modo monitor) -> solo avisa
 *  - cliente (no obligatorio) -> invitacion que se puede cerrar y se recuerda
 * Si el servidor ya limita la cuenta (`blocked`), no se muestra: `AuthGate` lleva a "Protege tu cuenta".
 */
export function EnrollmentBanner() {
  const { status, enrollment } = useSession();
  const pathname = usePathname();
  const [dismissed, setDismissed] = useState(true);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => setDismissed(readDismissed()), []);
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 60_000);
    return () => window.clearInterval(timer);
  }, []);

  const e = enrollment;
  const hidden = status !== 'authed' || !e || e.hasFactor || e.blocked || HIDDEN_ON.some((p) => pathname.startsWith(p));
  const left = e?.graceEndsAt ? timeLeft(e.graceEndsAt, now) : null;
  const mandatory = Boolean(e?.required);
  const show = !hidden && (mandatory || (Boolean(e?.recommended) && !dismissed));

  function dismiss() {
    setDismissed(true);
    try {
      localStorage.setItem(DISMISS_KEY, '1');
    } catch {
      /* sin almacenamiento: se cierra solo en esta visita */
    }
  }

  const text = mandatory
    ? left && !left.expired && !e?.mustEnrollNow
      ? `Tienes ${left.text} para activar la verificación en dos pasos.`
      : 'El plazo para activar la verificación en dos pasos venció.'
    : 'Protege tu cuenta con huella o Face ID.';

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="sc-float ui-font"
          initial={{ opacity: 0, y: -40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -40 }}
          transition={{ type: 'spring', stiffness: 380, damping: 32 }}
          role="status"
        >
          <div className={mandatory ? 'card warn' : 'card'}>
            <span className="ico">
              <Icon name={mandatory ? 'alert' : 'fingerprint'} size={20} />
            </span>
            <span className="msg">{text}</span>
            <Link href="/seguridad/activar">Activar</Link>
            {!mandatory && (
              <button type="button" className="x" onClick={dismiss} aria-label="Cerrar aviso">
                <Icon name="close" size={16} />
              </button>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
