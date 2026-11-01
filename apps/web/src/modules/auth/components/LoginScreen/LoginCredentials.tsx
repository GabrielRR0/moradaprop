'use client';

import Link from 'next/link';
import type { FormEvent } from 'react';
import { Icon } from '@/components/icons';
import { Button, Field, Notice } from '@/components/ui';
import { clock } from '../../hooks/useCooldown';
import type { LoginFlow } from '../../hooks/useLoginFlow';
import { HumanCheck } from '../shared/HumanCheck';

/** Paso 1 del login: correo y clave, o entrar directo con huella / Face ID. */
export function LoginCredentials({ flow }: { flow: LoginFlow }) {
  const { problem, pending, cooldown } = flow;

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    void flow.submitCredentials();
  }

  return (
    <form className="au-col" onSubmit={onSubmit} noValidate>
      <div>
        <h1 className="au-title">Ingresa a tu cuenta</h1>
        <p className="au-sub">Bienvenido de nuevo. Retoma donde lo dejaste.</p>
      </div>

      <Notice tone={problem?.kind === 'locked' ? 'warn' : 'error'} show={Boolean(problem)}>
        {problem?.text}
      </Notice>

      <Field
        label="Correo electrónico"
        type="email"
        value={flow.email}
        onChange={flow.setEmail}
        placeholder="nombre@correo.com"
        autoComplete="username webauthn"
        inputMode="email"
        error={flow.fieldErrors.email}
        autoFocus
      />
      <Field
        label="Contraseña"
        type="password"
        value={flow.password}
        onChange={flow.setPassword}
        placeholder="Tu contraseña"
        autoComplete="current-password webauthn"
        error={flow.fieldErrors.password}
      />
      <div className="au-between" style={{ marginTop: -6 }}>
        <span />
        <Link href="/recuperar" className="ui-link">
          ¿Olvidaste tu contraseña?
        </Link>
      </div>

      <HumanCheck check={flow.humanCheck} />

      <Button type="submit" block loading={pending} disabled={cooldown.active || !flow.humanCheck.ready}>
        {cooldown.active ? `Espera ${clock(cooldown.left)}` : 'Ingresar'}
      </Button>

      {flow.canPasskey && (
        <>
          <div className="ui-divider">o</div>
          <Button variant="secondary" block disabled={pending} onClick={flow.submitPasskeyLogin}>
            <Icon name="fingerprint" size={22} />
            Entrar con huella / Face ID
          </Button>
        </>
      )}
    </form>
  );
}
