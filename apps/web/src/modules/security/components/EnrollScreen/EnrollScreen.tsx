'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Icon } from '@/components/icons';
import { Button, Notice, StepSwitcher, SuccessBurst } from '@/components/ui';
import { passkeysSupported, routeAfterAuth, useSession } from '@/modules/auth';
import { timeLeft } from '../../services/deadline';
import { PasskeyAddForm } from '../shared/PasskeyAddForm';
import { SecurityShell } from '../shared/SecurityShell';
import { TotpSetup } from '../shared/TotpSetup';
import { MotionSupport } from '@/support/motion';

type Step = 'choose' | 'passkey' | 'totp' | 'done';

function Choose({ onPick, canPasskey }: { onPick: (step: Step) => void; canPasskey: boolean }) {
  return (
    <div className="sc-list">
      {canPasskey && (
        <MotionSupport.motion.button
          type="button"
          className="sc-method best"
          onClick={() => onPick('passkey')}
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          whileTap={{ scale: 0.98 }}
        >
          <span className="ico">
            <Icon name="fingerprint" size={28} />
          </span>
          <span className="txt">
            <b>
              Huella, Face ID o PIN <span className="sc-tag">Recomendado</span>
            </b>
            <span>La forma más rápida y segura. Nadie puede copiarla ni engañarte para que la entregues.</span>
          </span>
        </MotionSupport.motion.button>
      )}
      <MotionSupport.motion.button
        type="button"
        className="sc-method"
        onClick={() => onPick('totp')}
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.06 }}
        whileTap={{ scale: 0.98 }}
      >
        <span className="ico" style={{ background: 'var(--surf2)', color: 'var(--muted)' }}>
          <Icon name="smartphone" size={26} />
        </span>
        <span className="txt">
          <b>App autenticadora</b>
          <span>Google Authenticator, Authy o similar. Te damos códigos de respaldo por si pierdes el teléfono.</span>
        </span>
      </MotionSupport.motion.button>
    </div>
  );
}

/** "Protege tu cuenta": activar passkey o app autenticadora. Obligatoria para admin, dueños y agencias. */
export function EnrollScreen() {
  const router = useRouter();
  const session = useSession();
  const enrollment = session.enrollment;
  const [step, setStep] = useState<Step>('choose');
  const [showingCodes, setShowingCodes] = useState(false);
  const [canPasskey, setCanPasskey] = useState(false);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => setCanPasskey(passkeysSupported()), []);
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 60_000);
    return () => window.clearInterval(timer);
  }, []);

  // Quien ya tiene un factor (y no esta en medio del alta) ve directamente que esta protegido.
  const protectedAlready = Boolean(enrollment?.hasFactor) && step === 'choose';
  const view: Step = protectedAlready ? 'done' : step;
  const mandatory = Boolean(enrollment?.blocked || (enrollment?.mustEnrollNow && enrollment.mode !== 'monitor'));
  const left = enrollment?.graceEndsAt ? timeLeft(enrollment.graceEndsAt, now) : null;

  function leave() {
    if (session.user && enrollment) router.replace(routeAfterAuth({ user: session.user, enrollment }));
    else router.replace('/mapa');
  }

  return (
    <SecurityShell narrow>
      <StepSwitcher step={['choose', 'passkey', 'totp', 'done'].indexOf(view)}>
        {view === 'done' ? (
          <div className="sc-hero" style={{ alignItems: 'flex-start', gap: 16 }}>
            <SuccessBurst tone="ok" />
            <h1>Tu cuenta está protegida</h1>
            <p>
              Ya tienes verificación en dos pasos. Te recomendamos tener al menos <b>dos métodos</b> (dos passkeys,
              o una passkey y la app) por si pierdes el teléfono.
            </p>
            <Button block onClick={leave}>
              Continuar
            </Button>
            <Link href="/seguridad" className="ui-link" style={{ alignSelf: 'center' }}>
              Ver seguridad de la cuenta
            </Link>
          </div>
        ) : (
          <div className="sc-page" style={{ padding: 0 }}>
            {view === 'choose' ? (
              <>
                <div className="sc-hero">
                  <span className="ui-pulse waiting" style={{ width: 72, height: 72, marginBottom: 6 }}>
                    <Icon name="shield" size={34} />
                  </span>
                  <h1>Protege tu cuenta</h1>
                  <p>
                    {mandatory
                      ? 'Para seguir usando la plataforma necesitas activar la verificación en dos pasos. Toma menos de un minuto.'
                      : 'Añade un segundo paso para que nadie pueda entrar a tu cuenta aunque conozca tu contraseña.'}
                  </p>
                </div>
                <Notice tone="warn" show={Boolean(left && !left.expired && !mandatory)}>
                  Tienes <b>{left?.text}</b> para activarla.
                </Notice>
                <Choose onPick={setStep} canPasskey={canPasskey} />
                {!canPasskey && (
                  <p className="ui-hint">Este navegador no admite huella / Face ID: usa la app autenticadora.</p>
                )}
                {!mandatory && (
                  <button type="button" onClick={leave} className="ui-link" style={{ alignSelf: 'center' }}>
                    Ahora no
                  </button>
                )}
              </>
            ) : (
              <div className="sc-card">
                <div className="sc-head">
                  <h2>{view === 'passkey' ? 'Agregar huella / Face ID' : 'App autenticadora'}</h2>
                  {!showingCodes && (
                    <button type="button" className="ui-link" onClick={() => setStep('choose')}>
                      Cambiar método
                    </button>
                  )}
                </div>
                {view === 'passkey' ? (
                  <PasskeyAddForm onAdded={() => setStep('done')} />
                ) : (
                  <TotpSetup onDone={() => { setShowingCodes(false); setStep('done'); }} onStage={setShowingCodes} />
                )}
              </div>
            )}
          </div>
        )}
      </StepSwitcher>
    </SecurityShell>
  );
}
