'use client';

import { motion } from 'motion/react';
import './ui.css';

/** Circulo que aparece con rebote y se dibuja un check dentro. */
export function SuccessBurst({ size = 88, tone = 'brand' }: { size?: number; tone?: 'brand' | 'ok' }) {
  return (
    <motion.span
      className={tone === 'ok' ? 'ui-burst ok' : 'ui-burst'}
      style={{ width: size, height: size }}
      initial={{ scale: 0.4, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 320, damping: 18 }}
    >
      <svg
        width={size * 0.55}
        height={size * 0.55}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <motion.path
          d="M5 12l5 5 9-10"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ delay: 0.25, duration: 0.45, ease: 'easeOut' }}
        />
      </svg>
    </motion.span>
  );
}
