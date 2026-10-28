'use client';

import { useEffect, useId, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Icon } from '@/components/icons';
import './ui.css';
import { MotionSupport } from '@/support/motion';

/**
 * Panel que sube desde abajo en el telefono y aparece al centro en escritorio.
 * Se cierra con Escape, tocando fuera o con la X; en el telefono tambien arrastrando hacia abajo.
 * Mientras esta abierto la pagina de atras no se desplaza.
 */
export function Sheet({
  open,
  onClose,
  title,
  children,
  dismissible = true,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  /** false = no se puede cerrar (ej. mientras se guardan los codigos de respaldo). */
  dismissible?: boolean;
}) {
  const titleId = useId();

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && dismissible) onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener('keydown', onKey);
    };
  }, [open, dismissible, onClose]);

  if (typeof document === 'undefined') return null;
  return createPortal(
    <MotionSupport.AnimatePresence>
      {open && (
        <MotionSupport.motion.div
          className="ui-sheet-wrap ui-font"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={dismissible ? onClose : undefined}
        >
          <MotionSupport.motion.div
            className="ui-sheet"
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            initial={{ y: 60, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 60, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 380, damping: 34 }}
            drag={dismissible ? 'y' : false}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.6 }}
            onDragEnd={(_, info) => {
              if (info.offset.y > 120 || info.velocity.y > 600) onClose();
            }}
            onClick={(event) => event.stopPropagation()}
          >
            <span className="ui-sheet-grip" aria-hidden="true" />
            <div className="ui-sheet-head">
              <h2 id={titleId}>{title}</h2>
              {dismissible && (
                <button type="button" className="ui-eye" onClick={onClose} aria-label="Cerrar">
                  <Icon name="close" size={20} />
                </button>
              )}
            </div>
            <div className="ui-sheet-body">{children}</div>
          </MotionSupport.motion.div>
        </MotionSupport.motion.div>
      )}
    </MotionSupport.AnimatePresence>,
    document.body,
  );
}
