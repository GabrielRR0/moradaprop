'use client';

import { motion, useAnimationControls } from 'motion/react';
import { useEffect, useId, useState, type ChangeEvent, type ReactNode } from 'react';
import { Icon } from '@/components/icons';
import './ui.css';

interface FieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: 'text' | 'email' | 'password' | 'tel';
  placeholder?: string;
  autoComplete?: string;
  /** Texto de error: marca el campo en rojo y lo hace vibrar una vez. */
  error?: string | null;
  hint?: string;
  prefix?: ReactNode;
  autoFocus?: boolean;
  inputMode?: 'text' | 'email' | 'tel' | 'numeric';
  maxLength?: number;
  disabled?: boolean;
}

/** Campo con etiqueta, error animado y, en contrasenas, boton para ver lo escrito. */
export function Field({
  label,
  value,
  onChange,
  type = 'text',
  placeholder,
  autoComplete,
  error,
  hint,
  prefix,
  autoFocus,
  inputMode,
  maxLength,
  disabled,
}: FieldProps) {
  const id = useId();
  const [shown, setShown] = useState(false);
  const shake = useAnimationControls();
  // Cada error nuevo hace vibrar la caja una vez (sin recrearla: el cursor no se pierde).
  useEffect(() => {
    if (error) shake.start({ x: [0, -7, 7, -5, 5, 0], transition: { duration: 0.4 } });
  }, [error, shake]);
  const isPassword = type === 'password';
  return (
    <div className="ui-field">
      <label className="ui-label" htmlFor={id}>
        {label}
      </label>
      <motion.div className={error ? 'ui-box bad' : 'ui-box'} animate={shake}>
        {prefix && <span className="ui-affix">{prefix}</span>}
        <input
          id={id}
          type={isPassword && shown ? 'text' : type}
          value={value}
          placeholder={placeholder}
          autoComplete={autoComplete}
          autoFocus={autoFocus}
          inputMode={inputMode}
          maxLength={maxLength}
          disabled={disabled}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-err` : undefined}
          onChange={(event: ChangeEvent<HTMLInputElement>) => onChange(event.target.value)}
        />
        {isPassword && (
          <button
            type="button"
            className="ui-eye"
            onClick={() => setShown((s) => !s)}
            aria-label={shown ? 'Ocultar contraseña' : 'Mostrar contraseña'}
          >
            <Icon name={shown ? 'eye-off' : 'eye'} size={20} />
          </button>
        )}
      </motion.div>
      {error ? (
        <span id={`${id}-err`} className="ui-error" role="alert">
          {error}
        </span>
      ) : (
        hint && <span className="ui-hint">{hint}</span>
      )}
    </div>
  );
}
