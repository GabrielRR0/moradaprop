'use client';

import type { FormEvent } from 'react';
import { Button, Field, Notice, PasswordStrength } from '@/components/ui';
import { clock } from '../../hooks/useCooldown';
import type { RegisterFlow } from '../../hooks/useRegisterFlow';

/** Paso 2: datos de la cuenta. Los errores salen junto a cada campo; los del servidor, arriba. */
export function RegisterDataStep({ flow }: { flow: RegisterFlow }) {
  const { form, errors, setField } = flow;

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    void flow.createAccount();
  }

  return (
    <form className="au-col" onSubmit={onSubmit} noValidate>
      <div>
        <h1 className="au-title">{flow.role.dataTitle}</h1>
        <p className="au-sub">Solo lo necesario. Menos de un minuto.</p>
      </div>
      <Notice tone={flow.problem?.kind === 'locked' ? 'warn' : 'error'} show={Boolean(flow.problem)}>
        {flow.problem?.text}
      </Notice>
      {flow.isAgency && (
        <Field
          label="Nombre de la inmobiliaria"
          value={form.agencyName}
          onChange={(v) => setField('agencyName', v)}
          placeholder="Nombre comercial"
          autoComplete="organization"
          error={errors.agencyName}
        />
      )}
      <div className="au-row">
        <Field
          label="Nombre"
          value={form.firstName}
          onChange={(v) => setField('firstName', v)}
          autoComplete="given-name"
          error={errors.firstName}
        />
        <Field
          label="Apellido"
          value={form.lastName}
          onChange={(v) => setField('lastName', v)}
          autoComplete="family-name"
          error={errors.lastName}
        />
      </div>
      <Field
        label="Correo electrónico"
        type="email"
        value={form.email}
        onChange={(v) => setField('email', v)}
        placeholder="nombre@correo.com"
        autoComplete="email"
        inputMode="email"
        error={errors.email}
      />
      <Field
        label="Teléfono / WhatsApp (opcional)"
        type="tel"
        value={form.phone}
        onChange={(v) => setField('phone', v)}
        placeholder="412 000 0000"
        autoComplete="tel-national"
        inputMode="tel"
        prefix={<b>+58</b>}
        error={errors.phone}
      />
      <div className="au-col" style={{ gap: 10 }}>
        <Field
          label="Contraseña"
          type="password"
          value={form.password}
          onChange={(v) => setField('password', v)}
          placeholder="Mínimo 8, con letras y números"
          autoComplete="new-password"
          error={errors.password}
        />
        <PasswordStrength password={form.password} />
      </div>
      <div className="au-row">
        <div style={{ flex: '0 0 auto' }}>
          <Button variant="secondary" onClick={flow.goBack} disabled={flow.pending}>
            Atrás
          </Button>
        </div>
        <Button type="submit" block loading={flow.pending} disabled={flow.cooldown.active}>
          {flow.cooldown.active ? `Espera ${clock(flow.cooldown.left)}` : 'Crear cuenta'}
        </Button>
      </div>
      <p className="au-legal">
        Al continuar aceptas los Términos y la Política de privacidad. Protegemos tu cuenta con
        verificación por correo y, si quieres, huella, Face ID o doble factor.
      </p>
    </form>
  );
}
