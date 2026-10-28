'use client';

import { ErrorPage, HomeLink } from '@/components/ErrorPage';

/** Fallo inesperado dentro de una pagina: se ofrece reintentar sin perder el resto de la app. */
export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <ErrorPage
      code="500"
      title="Algo salió mal"
      text="Tuvimos un problema al cargar esta pantalla. Inténtalo de nuevo; si sigue pasando, vuelve al inicio."
      actions={
        <>
          <button type="button" className="ui-btn" onClick={reset}>
            Reintentar
          </button>
          <HomeLink />
        </>
      }
    />
  );
}
