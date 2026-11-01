'use client';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { Icon } from '@/components/icons';
import { brand } from '@/config';
import '../inbox.css';

/** Marco común de la bandeja y la conversación: barra superior con "volver", título y acciones. */
export function Shell({
  title,
  subtitle,
  back,
  backLabel,
  actions,
  children,
}: {
  title: string;
  subtitle?: string;
  back: string;
  backLabel: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="ib ui-font">
      <header className="ib-bar">
        <Link href={back} className="ib-back" aria-label={backLabel}>
          <Icon name="chevron-left" size={20} strokeWidth={2.6} />
        </Link>
        <div className="ib-bar-title">
          <h1>{title}</h1>
          {subtitle && <small>{subtitle}</small>}
        </div>
        {actions}
        <Link href="/" className="ib-brand" aria-label={`Ir al inicio de ${brand.name}`}>
          <Icon name="home" size={18} />
        </Link>
      </header>
      <main className="ib-main">{children}</main>
    </div>
  );
}

/** Botón "Recargar": gira mientras se piden los datos. La conversación no es en tiempo real. */
export function RefreshButton({ onClick, busy, label = 'Recargar' }: { onClick: () => void; busy: boolean; label?: string }) {
  return (
    <button type="button" className={busy ? 'ib-refresh busy' : 'ib-refresh'} onClick={onClick} disabled={busy} aria-label={label}>
      <Icon name="refresh" size={18} />
      <span>{label}</span>
    </button>
  );
}
