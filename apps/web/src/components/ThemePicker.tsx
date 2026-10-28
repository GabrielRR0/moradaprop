'use client';

import { useState } from 'react';
import { ACCENTS, useTheme } from '@/lib/theme';
import { Icon } from '@/components/icons';
import { MotionSupport } from '@/support/motion';

/** Boton flotante para probar el color de marca y el modo noche mientras se decide el diseno final. */
export function ThemePicker() {
  const { dark, accent, toggleDark, setAccent } = useTheme();
  const [open, setOpen] = useState(false);

  return (
    <div className="theme-picker">
      <MotionSupport.AnimatePresence>
        {open && (
          <MotionSupport.motion.div
            className="theme-panel"
            initial={{ opacity: 0, y: 12, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 400, damping: 28 }}
          >
            <span className="theme-title">Color de marca</span>
            <div className="theme-swatches">
              {ACCENTS.map((a) => (
                <button
                  key={a.value}
                  type="button"
                  aria-label={a.name}
                  title={a.name}
                  className={
                    accent.toLowerCase() === a.value.toLowerCase() ? 'swatch on' : 'swatch'
                  }
                  style={{ background: a.value }}
                  onClick={() => setAccent(a.value)}
                />
              ))}
              <input
                type="color"
                aria-label="Otro color"
                value={accent}
                onChange={(e) => setAccent(e.target.value)}
                className="swatch-custom"
              />
            </div>
            <button type="button" className="theme-toggle" onClick={toggleDark}>
              {dark ? 'Modo día' : 'Modo noche'}
            </button>
          </MotionSupport.motion.div>
        )}
      </MotionSupport.AnimatePresence>
      <button
        type="button"
        className="theme-fab"
        aria-label="Cambiar color y modo"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <Icon name="palette" size={22} />
      </button>
    </div>
  );
}
