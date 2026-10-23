'use client';

import Link from 'next/link';
import { Icon, type IconName } from '@/components/icons';
import { brand } from '@/config';

export type AgencySection =
  'resumen' | 'propiedades' | 'leads' | 'importar' | 'equipo' | 'reportes';

interface NavItem {
  section: AgencySection | 'ajustes';
  label: string;
  href: string;
  icon: IconName;
  /** Numerito a la derecha (ej. cuántas propiedades o leads nuevos). */
  badge?: string;
}

const NAV: NavItem[] = [
  { section: 'resumen', label: 'Resumen', href: '/panel', icon: 'dashboard' },
  {
    section: 'propiedades',
    label: 'Propiedades',
    href: '/panel/propiedades',
    icon: 'house',
    badge: '42',
  },
  { section: 'leads', label: 'Leads y citas', href: '/panel/leads', icon: 'whatsapp', badge: '7' },
  { section: 'importar', label: 'Importar Excel', href: '/panel/importar', icon: 'download' },
  { section: 'equipo', label: 'Equipo', href: '/panel/equipo', icon: 'team' },
  { section: 'reportes', label: 'Reportes', href: '/panel', icon: 'chart' },
];

const SETTINGS: NavItem = {
  section: 'ajustes',
  label: 'Ajustes',
  href: '/panel',
  icon: 'settings',
};

interface AgencySidebarProps {
  /** Sección que se está viendo (se resalta). */
  active: AgencySection;
  /** El resumen muestra además "Ajustes" y la tarjeta del plan. */
  withPlan?: boolean;
}

/** Barra lateral de las pantallas de escritorio de la inmobiliaria. */
export function AgencySidebar({ active, withPlan = false }: AgencySidebarProps) {
  const items = withPlan ? [...NAV, SETTINGS] : NAV;

  return (
    <aside
      style={{
        flex: '0 0 264px',
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
        padding: '22px 16px',
        borderRight: '1px solid var(--line)',
        background: 'var(--surf)',
      }}
    >
      <Link
        href="/"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '0 8px 18px',
          fontWeight: 800,
          fontSize: 19,
          letterSpacing: '-0.02em',
        }}
      >
        <span
          style={{
            width: 38,
            height: 38,
            borderRadius: 12,
            background: 'var(--ac)',
            display: 'grid',
            placeItems: 'center',
            color: '#fff',
          }}
        >
          <Icon name="home" size={21} />
        </span>
        {` ${brand.name} `}
      </Link>

      {items.map((item) => (
        <Link
          key={item.label}
          href={item.href}
          className={item.section === active ? 'nav on' : 'nav'}
        >
          <Icon name={item.icon} size={22} />
          {item.label}
          {item.badge && <span className="c">{item.badge}</span>}
        </Link>
      ))}

      <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {withPlan && <PlanCard />}
        <AgencyUser />
      </div>
    </aside>
  );
}

/** Cuánto del plan se está usando (propiedades y agentes). */
function PlanCard() {
  return (
    <div style={{ padding: 16, borderRadius: 18, background: 'var(--ac-soft)' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: 13,
          fontWeight: 800,
          color: 'var(--ac-ink)',
        }}
      >
        <span>Plan Profesional</span>
        <span>42 / 100</span>
      </div>
      <div
        style={{
          height: 8,
          borderRadius: 4,
          background: 'var(--surf)',
          margin: '10px 0 8px',
          overflow: 'hidden',
        }}
      >
        <div style={{ width: '42%', height: '100%', background: 'var(--ac)', borderRadius: 4 }} />
      </div>
      <div style={{ fontSize: 12, color: 'var(--muted)' }}>
        Propiedades publicadas · 3 de 5 agentes
      </div>
    </div>
  );
}

/** Quién está conectado (abajo de la barra lateral). */
function AgencyUser() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 8 }}>
      <span
        style={{
          width: 42,
          height: 42,
          borderRadius: '50%',
          background: 'var(--ac)',
          color: '#fff',
          display: 'grid',
          placeItems: 'center',
          fontWeight: 800,
        }}
      >
        IN
      </span>
      <span style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <span style={{ fontWeight: 800, fontSize: 14 }}>Inmobiliaria [Nombre]</span>
        <span style={{ fontSize: 12, color: 'var(--muted)' }}>Administrador</span>
      </span>
    </div>
  );
}
