'use client';

import { motion } from 'motion/react';
import type { ReactNode } from 'react';

/** Transicion suave al cambiar de pagina (template se vuelve a montar en cada navegacion). */
export default function Template({ children }: { children: ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.2, 0.8, 0.2, 1] } }}
    >
      {children}
    </motion.div>
  );
}
