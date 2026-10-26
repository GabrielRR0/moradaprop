'use client';

import { motion } from 'motion/react';
import type { ReactNode } from 'react';
import './ui.css';

interface ButtonProps {
  children: ReactNode;
  onClick?: () => void;
  type?: 'button' | 'submit';
  /** primary = color de marca; secondary = contorno; danger = rojo. */
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'md' | 'sm';
  block?: boolean;
  /** Muestra la ruedita y bloquea el boton: nadie envia dos veces. */
  loading?: boolean;
  disabled?: boolean;
  label?: string;
}

/** Boton con respuesta al toque (se hunde un poco) y estado de carga. */
export function Button({
  children,
  onClick,
  type = 'button',
  variant = 'primary',
  size = 'md',
  block,
  loading,
  disabled,
  label,
}: ButtonProps) {
  const secondary = variant === 'secondary';
  const className = [
    secondary ? 'ui-btn2' : 'ui-btn',
    variant === 'danger' && secondary ? 'danger' : '',
    variant === 'danger' && !secondary ? 'danger' : '',
    size === 'sm' ? 'sm' : '',
    block ? 'block' : '',
  ]
    .filter(Boolean)
    .join(' ');
  return (
    <motion.button
      type={type}
      className={className}
      onClick={onClick}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      aria-label={label}
      whileTap={disabled || loading ? undefined : { scale: 0.97 }}
      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
    >
      {loading ? <span className="ui-spinner" role="status" aria-label="Cargando" /> : children}
    </motion.button>
  );
}
