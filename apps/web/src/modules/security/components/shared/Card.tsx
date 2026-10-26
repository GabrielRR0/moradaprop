'use client';

import { motion } from 'motion/react';
import type { ReactNode } from 'react';
import { Button, Notice, Sheet } from '@/components/ui';
import { useAction } from '../../hooks/useAction';
import './security.css';

/** Tarjeta que sube suavemente al entrar; `index` escalona la aparicion. */
export function Card({
  title,
  lead,
  action,
  index = 0,
  children,
}: {
  title: string;
  lead?: string;
  action?: ReactNode;
  index?: number;
  children: ReactNode;
}) {
  return (
    <motion.section
      className="sc-card"
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.05 * index, duration: 0.35, ease: [0.2, 0.8, 0.2, 1] }}
    >
      <div className="sc-head">
        <h2>{title}</h2>
        {action}
      </div>
      {lead && <p className="lead">{lead}</p>}
      {children}
    </motion.section>
  );
}

/** Mientras carga una lista: bloques que brillan. Si falla: mensaje y boton para reintentar. */
export function ListState({
  loading,
  error,
  onRetry,
  empty,
  children,
}: {
  loading: boolean;
  error: boolean;
  onRetry: () => void;
  /** Texto cuando la lista esta vacia; si no se da, no se comprueba. */
  empty?: string;
  children: ReactNode;
}) {
  if (loading) {
    return (
      <div className="sc-list" aria-busy="true">
        <div className="sc-skel" />
        <div className="sc-skel" />
      </div>
    );
  }
  if (error) {
    return (
      <Notice tone="error">
        No pudimos cargar esta información.{' '}
        <button type="button" className="ui-link" onClick={onRetry}>
          Reintentar
        </button>
      </Notice>
    );
  }
  return empty ? <div className="sc-empty">{empty}</div> : <>{children}</>;
}

/** Pide confirmar una accion delicada (quitar, cerrar sesiones). Muestra el error del servidor si falla. */
export function ConfirmSheet({
  open,
  onClose,
  title,
  text,
  confirmLabel,
  danger,
  onConfirm,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  text: string;
  confirmLabel: string;
  danger?: boolean;
  onConfirm: () => Promise<unknown>;
}) {
  const action = useAction();
  async function confirm() {
    const ok = await action.run(async () => {
      await onConfirm();
      return true;
    });
    if (ok) onClose();
  }
  return (
    <Sheet open={open} onClose={onClose} title={title}>
      <p style={{ margin: 0, color: 'var(--muted)', lineHeight: 1.5 }}>{text}</p>
      <Notice tone="error" show={Boolean(action.problem)}>
        {action.problem?.text}
      </Notice>
      <div className="sc-actions">
        <Button variant="secondary" onClick={onClose} disabled={action.pending}>
          Cancelar
        </Button>
        <Button variant={danger ? 'danger' : 'primary'} onClick={confirm} loading={action.pending}>
          {confirmLabel}
        </Button>
      </div>
    </Sheet>
  );
}
