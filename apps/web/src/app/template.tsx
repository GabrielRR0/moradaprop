'use client';

import type { ReactNode } from 'react';
import { MotionSupport } from '@/support/motion';

/** Transicion suave al cambiar de pagina (template se vuelve a montar en cada navegacion). */
export default function Template({ children }: { children: ReactNode }) {
  return (
    <MotionSupport.motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.2, 0.8, 0.2, 1] } }}
    >
      {children}
    </MotionSupport.motion.div>
  );
}
