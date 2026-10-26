'use client';

import { AnimatePresence, motion } from 'motion/react';
import { useRef, type ReactNode } from 'react';

/**
 * Cambia de paso con deslizamiento: avanzar entra desde la derecha, volver desde la izquierda,
 * como las pantallas de una app. `step` es un numero (mayor = mas adelante).
 */
export function StepSwitcher({ step, children }: { step: number; children: ReactNode }) {
  const previous = useRef(step);
  const direction = step >= previous.current ? 1 : -1;
  previous.current = step;
  return (
    <AnimatePresence mode="wait" initial={false} custom={direction}>
      <motion.div
        key={step}
        custom={direction}
        variants={{
          enter: (d: number) => ({ opacity: 0, x: 36 * d }),
          center: { opacity: 1, x: 0 },
          exit: (d: number) => ({ opacity: 0, x: -36 * d }),
        }}
        initial="enter"
        animate="center"
        exit="exit"
        transition={{ duration: 0.26, ease: [0.2, 0.8, 0.2, 1] }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
