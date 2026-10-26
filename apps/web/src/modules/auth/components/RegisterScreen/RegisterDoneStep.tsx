'use client';

import { Button, Notice, SuccessBurst } from '@/components/ui';
import type { RegisterFlow } from '../../hooks/useRegisterFlow';

/** Paso final: cuenta verificada y con sesion iniciada. Dueno y agencia pasan antes por "Protege tu cuenta". */
export function RegisterDoneStep({ flow }: { flow: RegisterFlow }) {
  return (
    <div className="au-center" style={{ alignItems: 'flex-start', textAlign: 'left' }}>
      <SuccessBurst />
      <h1 className="au-title">¡Cuenta verificada!</h1>
      <p className="au-sub" style={{ margin: 0 }}>
        {flow.role.doneText}
      </p>
      <div style={{ width: '100%' }}>
        <Notice tone="info" show={flow.mustProtect}>
          Antes de empezar, activa tu huella, Face ID o una app autenticadora. Es obligatorio para cuentas de{' '}
          {flow.isAgency ? 'inmobiliaria' : 'dueño'} y toma menos de un minuto.
        </Notice>
      </div>
      <Button block onClick={flow.finish}>
        {flow.mustProtect ? 'Proteger mi cuenta' : flow.role.doneButton}
      </Button>
    </div>
  );
}
