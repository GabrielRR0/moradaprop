'use client';

import { useEffect, useRef } from 'react';
import { Icon } from '@/components/icons';
import { TurnstileSupport } from '@/support/turnstile';
import type { HumanCheck as HumanCheckState } from '../../hooks/useHumanCheck';

/**
 * El widget "no soy un robot" de un formulario. No dibuja nada si la API lo tiene apagado.
 * Casi siempre se resuelve en silencio; solo se ve algo si hace falta una accion o si falla.
 * `quiet` oculta el aviso de "verificando" (para pasos donde el widget solo se usa si se toca "Reenviar").
 */
export function HumanCheck({ check, quiet = false }: { check: HumanCheckState; quiet?: boolean }) {
  const box = useRef<HTMLDivElement>(null);
  const { enabled, siteKey, attempt, onToken, onError, onExpire, attach } = check;

  useEffect(() => {
    const container = box.current;
    if (!enabled || !siteKey || !container) return;
    let cancelled = false;
    let drawn: TurnstileSupport.Widget | null = null;
    TurnstileSupport.render(container, { sitekey: siteKey, onToken, onError, onExpire })
      .then((widget) => {
        if (cancelled) widget.remove();
        else {
          drawn = widget;
          attach(widget);
        }
      })
      .catch(onError);
    return () => {
      cancelled = true;
      drawn?.remove();
      attach(null);
    };
  }, [enabled, siteKey, attempt, onToken, onError, onExpire, attach]);

  if (!enabled) return null;

  const verified = check.ready;
  return (
    <div className="au-human" aria-live="polite">
      <div ref={box} />
      {check.failed ? (
        <p className="au-human-note bad">
          <Icon name="alert" size={16} />
          <span>
            No pudimos cargar la verificación. Revisa tu conexión o desactiva el bloqueador de contenido.{' '}
            <button type="button" className="ui-link" onClick={check.retry}>
              Reintentar
            </button>
          </span>
        </p>
      ) : (
        !quiet && (
          <p className={verified ? 'au-human-note ok' : 'au-human-note'}>
            {verified ? <Icon name="check" size={16} /> : <span className="au-human-dot" aria-hidden="true" />}
            <span>{verified ? 'Verificado' : 'Comprobando que eres una persona…'}</span>
          </p>
        )
      )}
    </div>
  );
}
