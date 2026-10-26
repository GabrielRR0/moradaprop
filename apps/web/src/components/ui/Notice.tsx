'use client';

import { AnimatePresence, motion } from 'motion/react';
import type { ReactNode } from 'react';
import { Icon } from '@/components/icons';
import './ui.css';

export type NoticeTone = 'error' | 'warn' | 'info' | 'ok';

const ICON = { error: 'alert', warn: 'alert', info: 'shield', ok: 'check' } as const;

/** Aviso en linea que entra y sale suavemente (la altura tambien se anima, nada salta). */
export function Notice({
  tone = 'info',
  show = true,
  children,
}: {
  tone?: NoticeTone;
  show?: boolean;
  children: ReactNode;
}) {
  return (
    <AnimatePresence initial={false}>
      {show && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.25, ease: [0.2, 0.8, 0.2, 1] }}
          style={{ overflow: 'hidden' }}
        >
          <div className={`ui-notice ${tone}`} role={tone === 'error' ? 'alert' : 'status'}>
            <span className="ico">
              <Icon name={ICON[tone]} size={20} />
            </span>
            <div>{children}</div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
