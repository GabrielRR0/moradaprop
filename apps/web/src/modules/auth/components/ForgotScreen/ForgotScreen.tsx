'use client';

import Link from 'next/link';
import type { FormEvent } from 'react';
import { Button, CodeInput, Field, Notice, PasswordStrength, StepSwitcher, SuccessBurst } from '@/components/ui';
import { clock } from '../../hooks/useCooldown';
import { FORGOT_DONE, FORGOT_RESET, useForgotFlow, type ForgotFlow } from '../../hooks/useForgotFlow';
import { AuthLayout } from '../shared/AuthLayout';
import { HumanCheck } from '../shared/HumanCheck';

function EmailStep({ flow }: { flow: ForgotFlow }) {
  function onSubmit(event: FormEvent) {
    event.preventDefault();
    void flow.sendCode();
  }
  return (
    <form className="au-col" onSubmit={onSubmit} noValidate>
      <div>
        <h1 className="au-title">Recupera tu contraseña</h1>
        <p className="au-sub">Escribe tu correo y te enviamos un código para crear una nueva.</p>
      </div>
      <Notice tone="error" show={Boolean(flow.problem)}>
        {flow.problem?.text}
      </Notice>
      <Field
        label="Correo electrónico"
        type="email"
        value={flow.email}
        onChange={flow.setEmail}
        placeholder="nombre@correo.com"
        autoComplete="email"
        inputMode="email"
        error={flow.emailError}
        autoFocus
      />
      <HumanCheck check={flow.humanCheck} />
      <Button type="submit" block loading={flow.pending} disabled={!flow.humanCheck.ready}>
        Enviar código
      </Button>
      <Link href="/ingresar" className="ui-link" style={{ textAlign: 'center' }}>
        Volver a ingresar
      </Link>
    </form>
  );
}

function ResetStep({ flow }: { flow: ForgotFlow }) {
  function onSubmit(event: FormEvent) {
    event.preventDefault();
    void flow.reset();
  }
  return (
    <form className="au-col" onSubmit={onSubmit} noValidate>
      <div>
        <h1 className="au-title">Crea una contraseña nueva</h1>
        <p className="au-sub">
          Si <b>{flow.email}</b> es un correo válido, te enviamos un código de 6 dígitos.
        </p>
      </div>
      <Notice tone="error" show={Boolean(flow.problem)}>
        {flow.problem?.text}
      </Notice>
      <CodeInput
        value={flow.code}
        onChange={flow.setCode}
        bad={flow.problem?.kind === 'credentials'}
        shakeKey={flow.shakeKey}
        disabled={flow.pending}
        autoFocus
      />
      <div className="au-between" style={{ marginTop: -6 }}>
        <span>¿No te llegó?</span>
        <button type="button" className="ui-link" disabled={flow.cooldown.active || !flow.humanCheck.ready} onClick={flow.resend}>
          {flow.cooldown.active ? `Reenviar en ${clock(flow.cooldown.left)}` : 'Reenviar código'}
        </button>
      </div>
      <HumanCheck check={flow.humanCheck} quiet />
      <div className="au-col" style={{ gap: 10 }}>
        <Field
          label="Contraseña nueva"
          type="password"
          value={flow.password}
          onChange={flow.setPassword}
          autoComplete="new-password"
          placeholder="Mínimo 8, con letras y números"
          error={flow.passwordError}
        />
        <PasswordStrength password={flow.password} />
      </div>
      <Notice tone="info">Al restablecerla cerramos todas tus sesiones abiertas.</Notice>
      <div className="au-row">
        <div style={{ flex: '0 0 auto' }}>
          <Button variant="secondary" onClick={flow.backToEmail} disabled={flow.pending}>
            Atrás
          </Button>
        </div>
        <Button type="submit" block loading={flow.pending} disabled={flow.code.length < 6}>
          Cambiar contraseña
        </Button>
      </div>
    </form>
  );
}

function DoneStep() {
  return (
    <div className="au-center" style={{ alignItems: 'flex-start', textAlign: 'left' }}>
      <SuccessBurst tone="ok" />
      <h1 className="au-title">¡Contraseña actualizada!</h1>
      <p className="au-sub" style={{ margin: 0 }}>
        Ya puedes ingresar con tu contraseña nueva. Cerramos tus otras sesiones por seguridad.
      </p>
      <Link href="/ingresar" className="ui-btn block">
        Ir a ingresar
      </Link>
    </div>
  );
}

export function ForgotScreen() {
  const flow = useForgotFlow();
  return (
    <AuthLayout
      headline="Recuperar el acceso es rápido"
      subtitle="Te enviamos un código de un solo uso. Nadie, ni nosotros, puede ver tu contraseña."
      benefits={['Código de 6 dígitos al correo', 'Cierre de todas las sesiones abiertas', 'Sin soporte ni esperas']}
      switchText="¿La recordaste?"
      switchLabel="Ingresar"
      switchHref="/ingresar"
    >
      <StepSwitcher step={flow.step}>
        {flow.step === FORGOT_DONE ? <DoneStep /> : flow.step === FORGOT_RESET ? <ResetStep flow={flow} /> : <EmailStep flow={flow} />}
      </StepSwitcher>
    </AuthLayout>
  );
}
