'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { MotionSupport } from '@/support/motion';

/**
 * Cambia de paso con deslizamiento: avanzar entra desde la derecha, volver desde la izquierda,
 * como las pantallas de una app. `step` es un numero (mayor = mas adelante).
 */
export function StepSwitcher({ step, children }: { step: number; children: ReactNode }) {
  const previous = useRef(step);
  const direction = step >= previous.current ? 1 : -1;
  previous.current = step;
  // El primer paso se pinta ya visible (servidor y cliente igual: sin desajuste de hidratacion);
  // solo los cambios posteriores entran deslizando.
  const mounted = useRef(false);
  useEffect(() => {
    mounted.current = true;
  }, []);
  return (
    <MotionSupport.AnimatePresence mode="wait" initial={false} custom={direction}>
      <MotionSupport.motion.div
        key={step}
        custom={direction}
        variants={{
          enter: (d: number) => ({ opacity: 0, x: 36 * d }),
          center: { opacity: 1, x: 0 },
          exit: (d: number) => ({ opacity: 0, x: -36 * d }),
        }}
        initial={mounted.current ? 'enter' : false}
        animate="center"
        exit="exit"
        transition={{ duration: 0.26, ease: [0.2, 0.8, 0.2, 1] }}
      >
        {children}
      </MotionSupport.motion.div>
    </MotionSupport.AnimatePresence>
  );
}
