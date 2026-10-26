'use client';

import { useState, type FormEvent } from 'react';
import { Icon } from '@/components/icons';
import { Button, Field, Notice } from '@/components/ui';
import { usePasskeyAdd } from '../../hooks/usePasskeyAdd';

/**
 * Formulario para agregar una passkey: contrasena (si la cuenta tiene), nombre opcional y el boton
 * que abre el dialogo del sistema (huella, Face ID, Windows Hello). Mientras el sistema espera
 * se muestra el boton cargando.
 */
export function PasskeyAddForm({ onAdded, submitLabel = 'Usar huella / Face ID' }: { onAdded: () => void; submitLabel?: string }) {
  const flow = usePasskeyAdd(onAdded);
  const [password, setPassword] = useState('');
  const [label, setLabel] = useState('');

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    void flow.add(password, label);
  }

  return (
    <form style={{ display: 'flex', flexDirection: 'column', gap: 16 }} onSubmit={onSubmit} noValidate>
      <Notice tone={flow.problem?.kind === 'locked' ? 'warn' : 'error'} show={Boolean(flow.problem)}>
        {flow.problem?.text}
      </Notice>
      {flow.needsPassword && (
        <Field
          label="Tu contraseña"
          type="password"
          value={password}
          onChange={(value) => {
            setPassword(value);
            flow.clearProblem();
          }}
          autoComplete="current-password"
          hint="La pedimos otra vez para confirmar que eres tú."
          autoFocus
        />
      )}
      <Field
        label="Nombre (opcional)"
        value={label}
        onChange={setLabel}
        placeholder="Ej. Mi laptop"
        maxLength={60}
      />
      <Button type="submit" block loading={flow.pending}>
        <Icon name="fingerprint" size={22} />
        {submitLabel}
      </Button>
    </form>
  );
}
