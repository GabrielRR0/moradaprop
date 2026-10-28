import type { Metadata } from 'next';
import { ErrorPage, HomeLink, MapLink } from '@/components/ErrorPage';

export const metadata: Metadata = { title: 'Página no encontrada' };

/** Cualquier ruta que no existe. */
export default function NotFound() {
  return (
    <ErrorPage
      code="404"
      title="Esta página no existe"
      text="Puede que el enlace esté mal escrito o que la propiedad ya no esté disponible."
      actions={
        <>
          <HomeLink />
          <MapLink />
        </>
      }
    />
  );
}
