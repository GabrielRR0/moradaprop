'use client';

import Link from 'next/link';
import { Icon, type IconName } from '@/components/icons';

export type AgencyTab = 'resumen' | 'propiedades' | 'leads' | 'equipo';

interface TabItem {
  tab: AgencyTab;
  label: string;
  href: string;
  icon: IconName;
}

const TABS: TabItem[] = [
  { tab: 'resumen', label: 'Resumen', href: '/panel', icon: 'dashboard' },
  { tab: 'propiedades', label: 'Propiedades', href: '/panel/propiedades', icon: 'house' },
  { tab: 'leads', label: 'Leads', href: '/panel/leads', icon: 'whatsapp' },
  { tab: 'equipo', label: 'Equipo', href: '/panel/equipo', icon: 'team' },
];

/** Botón redondo del centro para publicar una propiedad. */
function PublishButton() {
  return (
    <Link
      href="/publicar"
      aria-label="Publicar"
      style={{
        flex: '0 0 58px',
        height: 58,
        margin: '-18px 6px 0',
        borderRadius: '50%',
        background: 'var(--ac)',
        color: '#fff',
        display: 'grid',
        placeItems: 'center',
        boxShadow: '0 10px 24px color-mix(in srgb, var(--ac) 50%, transparent)',
      }}
    >
      <Icon name="plus" size={28} strokeWidth={2.8} />
    </Link>
  );
}

/** Barra de pestañas de abajo en el teléfono: Resumen, Propiedades, [+ publicar], Leads, Equipo. */
export function AgencyTabBar({ active }: { active: AgencyTab }) {
  const [first, second, ...rest] = TABS;
  const tab = (t: TabItem) => (
    <Link key={t.tab} href={t.href} className={t.tab === active ? 'tb on' : 'tb'}>
      <Icon name={t.icon} />
      {t.label}
    </Link>
  );

  return (
    <nav
      style={{
        flex: '0 0 76px',
        display: 'flex',
        alignItems: 'center',
        padding: '0 6px 8px',
        borderTop: '1px solid var(--line)',
        background: 'var(--surf)',
      }}
    >
      {tab(first)}
      {tab(second)}
      <PublishButton />
      {rest.map(tab)}
    </nav>
  );
}
