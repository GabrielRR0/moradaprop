'use client';

import { motion, useAnimationControls } from 'motion/react';
import { useEffect, useRef, type ClipboardEvent, type KeyboardEvent } from 'react';
import './ui.css';

interface CodeInputProps {
  value: string;
  onChange: (value: string) => void;
  /** Se llama una sola vez cuando se completan todos los digitos (tambien al pegar). */
  onComplete?: (value: string) => void;
  length?: number;
  bad?: boolean;
  disabled?: boolean;
  autoFocus?: boolean;
  /** Cambia con cada intento fallido para repetir la vibracion. */
  shakeKey?: number;
}

/** Codigo de N digitos en casillas: avanza solo, retrocede con borrar y acepta pegar el codigo entero. */
export function CodeInput({
  value,
  onChange,
  onComplete,
  length = 6,
  bad,
  disabled,
  autoFocus,
  shakeKey = 0,
}: CodeInputProps) {
  const refs = useRef<Array<HTMLInputElement | null>>([]);
  const shake = useAnimationControls();
  useEffect(() => {
    if (shakeKey) shake.start({ x: [0, -9, 9, -6, 6, 0], transition: { duration: 0.4 } });
  }, [shakeKey, shake]);
  const digits = Array.from({ length }, (_, i) => value[i] ?? '');

  function commit(next: string, focusAt?: number) {
    const clean = next.replace(/\D/g, '').slice(0, length);
    onChange(clean);
    const target = Math.min(focusAt ?? clean.length, length - 1);
    refs.current[target]?.focus();
    if (clean.length === length) onComplete?.(clean);
  }

  function onInput(index: number, raw: string) {
    const typed = raw.replace(/\D/g, '');
    if (!typed) return;
    // Varios digitos de golpe (autocompletado del telefono): se reparten desde esta casilla.
    commit(value.slice(0, index) + typed + value.slice(index + typed.length), index + typed.length);
  }

  function onKeyDown(index: number, event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Backspace') {
      event.preventDefault();
      if (digits[index]) commit(value.slice(0, index) + value.slice(index + 1), index);
      else if (index > 0) commit(value.slice(0, index - 1) + value.slice(index), index - 1);
    } else if (event.key === 'ArrowLeft' && index > 0) refs.current[index - 1]?.focus();
    else if (event.key === 'ArrowRight' && index < length - 1) refs.current[index + 1]?.focus();
  }

  function onPaste(event: ClipboardEvent<HTMLInputElement>) {
    event.preventDefault();
    commit(event.clipboardData.getData('text'));
  }

  return (
    <motion.div
      className={bad ? 'ui-code bad' : 'ui-code'}
      animate={shake}
      role="group"
      aria-label="Código de verificación"
    >
      {digits.map((digit, index) => (
        <input
          key={index}
          ref={(node) => {
            refs.current[index] = node;
          }}
          className={digit ? 'filled' : undefined}
          value={digit}
          inputMode="numeric"
          autoComplete={index === 0 ? 'one-time-code' : 'off'}
          autoFocus={autoFocus && index === 0}
          disabled={disabled}
          aria-label={`Dígito ${index + 1}`}
          onChange={(event) => onInput(index, event.target.value)}
          onKeyDown={(event) => onKeyDown(index, event)}
          onPaste={onPaste}
          onFocus={(event) => event.target.select()}
        />
      ))}
    </motion.div>
  );
}
