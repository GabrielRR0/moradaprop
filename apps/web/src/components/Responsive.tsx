import type { ReactNode } from 'react';

/**
 * Muestra la version de escritorio o la movil del diseno segun el ancho de la ventana.
 * Se resuelve con CSS (ver globals.css) para que no haya parpadeo ni desajuste de hidratacion.
 */
export function Responsive({ desktop, mobile }: { desktop: ReactNode; mobile: ReactNode }) {
  return (
    <>
      <div className="only-desktop">{desktop}</div>
      <div className="only-mobile">{mobile}</div>
    </>
  );
}
