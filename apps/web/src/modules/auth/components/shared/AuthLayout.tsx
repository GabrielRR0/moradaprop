'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';
import { Icon } from '@/components/icons';
import { brand } from '@/config';
import '@/components/ui/ui.css';
import './auth.css';

interface AuthLayoutProps {
  /** Panel de color (solo escritorio). */
  headline: string;
  subtitle: string;
  benefits: string[];
  /** Texto + enlace de arriba a la derecha: "¿Ya tienes cuenta? Ingresar". */
  switchText: string;
  switchLabel: string;
  switchHref: string;
  wide?: boolean;
  children: ReactNode;
}

/**
 * Marco de todas las pantallas de acceso. En escritorio: panel de color + formulario.
 * En el telefono el panel desaparece y queda una cabecera con la marca.
 */
export function AuthLayout({
  headline,
  subtitle,
  benefits,
  switchText,
  switchLabel,
  switchHref,
  wide,
  children,
}: AuthLayoutProps) {
  return (
    <div className="au ui-font">
      <aside className="au-aside">
        <span className="orb a" />
        <span className="orb b" />
        <Link href="/" className="au-brand">
          <span className="mark">
            <Icon name="house" size={22} />
          </span>
          {brand.name}
        </Link>
        <div className="copy">
          <h2>{headline}</h2>
          <p>{subtitle}</p>
          <ul>
            {benefits.map((text) => (
              <li key={text}>
                <span className="tick">
                  <Icon name="check" size={14} strokeWidth={3.4} />
                </span>
                {text}
              </li>
            ))}
          </ul>
        </div>
      </aside>
      <main className="au-main">
        <div className="au-top">
          <Link href="/" className="au-brand">
            <span className="mark">
              <Icon name="house" size={18} />
            </span>
            {brand.name}
          </Link>
          <span>
            {switchText}{' '}
            <Link href={switchHref} className="go">
              {switchLabel}
            </Link>
          </span>
        </div>
        <div className={wide ? 'au-stage wide' : 'au-stage'}>{children}</div>
      </main>
    </div>
  );
}
