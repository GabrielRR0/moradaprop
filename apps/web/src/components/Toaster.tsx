'use client';

import { useEffect, useState } from 'react';
import { subscribeToasts, type ToastMessage } from '@/lib/toast';
import { MotionSupport } from '@/support/motion';

const COLORS = { ok: '#1F9D55', info: 'var(--ac)', warn: '#D98A00' } as const;

export function Toaster() {
  const [items, setItems] = useState<ToastMessage[]>([]);

  useEffect(
    () =>
      subscribeToasts((message) => {
        setItems((prev) => [...prev.slice(-2), message]);
        window.setTimeout(() => setItems((prev) => prev.filter((t) => t.id !== message.id)), 2600);
      }),
    [],
  );

  return (
    <div className="toaster" aria-live="polite">
      <MotionSupport.AnimatePresence>
        {items.map((item) => (
          <MotionSupport.motion.div
            key={item.id}
            className="toast"
            initial={{ opacity: 0, y: 24, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 420, damping: 28 }}
          >
            <span className="toast-dot" style={{ background: COLORS[item.tone] }} />
            {item.text}
          </MotionSupport.motion.div>
        ))}
      </MotionSupport.AnimatePresence>
    </div>
  );
}
