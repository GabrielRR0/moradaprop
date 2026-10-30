'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Button, Sheet } from '@/components/ui';
import { subscribeLoginPrompt, type LoginPromptRequest } from '@/lib/login-prompt';

/** Aviso que pide ingresar cuando alguien sin sesión toca algo que la requiere (favoritos, alertas...). */
export function LoginPrompt() {
  const router = useRouter();
  const [request, setRequest] = useState<LoginPromptRequest | null>(null);
  // Se recuerda el último texto para que no se vacíe mientras el panel se cierra.
  const [last, setLast] = useState<LoginPromptRequest | null>(null);

  useEffect(
    () =>
      subscribeLoginPrompt((next) => {
        setRequest(next);
        setLast(next);
      }),
    [],
  );

  const close = () => setRequest(null);

  return (
    <Sheet open={!!request} onClose={close} title="Ingresa para continuar">
      <p style={{ margin: '0 0 20px', fontSize: 15, lineHeight: 1.5, opacity: 0.8 }}>
        {`Necesitas una cuenta para ${last?.reason ?? 'continuar'}. Ingresa o crea una en menos de un minuto.`}
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <Button
          block
          onClick={() => {
            close();
            router.push(`/ingresar?next=${encodeURIComponent(last?.next ?? '/')}`);
          }}
        >
          Ir a ingresar
        </Button>
        <Button block variant="secondary" onClick={close}>
          Ahora no
        </Button>
      </div>
    </Sheet>
  );
}
