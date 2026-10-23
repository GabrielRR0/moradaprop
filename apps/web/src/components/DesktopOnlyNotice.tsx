'use client';

import { motion } from 'motion/react';
import Link from 'next/link';
import { Icon } from '@/components/icons';

/** Aviso para pantallas pensadas solo para computador (ej: moderacion del administrador). */
export function DesktopOnlyNotice() {
  return (
    <div
      style={{
        minHeight: '100dvh',
        display: 'grid',
        placeItems: 'center',
        padding: 24,
        background: 'var(--bg)',
        color: 'var(--text)',
        fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
        textAlign: 'center',
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 260, damping: 24 }}
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 16,
          maxWidth: 340,
        }}
      >
        <motion.span
          animate={{ y: [0, -8, 0] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
          style={{
            width: 72,
            height: 72,
            borderRadius: 22,
            background: 'var(--ac-soft)',
            color: 'var(--ac-ink)',
            display: 'grid',
            placeItems: 'center',
          }}
        >
          <Icon name="monitor" size={34} strokeWidth={2} />
        </motion.span>
        <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, letterSpacing: '-0.02em' }}>
          Mejor desde un computador
        </h1>
        <p style={{ margin: 0, fontSize: 15, lineHeight: 1.55, color: 'var(--muted)' }}>
          La moderación necesita pantalla grande para revisar bien cada anuncio. Ábrela desde tu
          computador.
        </p>
        <Link
          href="/"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: 52,
            padding: '0 24px',
            borderRadius: 16,
            background: 'var(--ac)',
            color: '#fff',
            fontWeight: 800,
            fontSize: 15,
            textDecoration: 'none',
          }}
        >
          Volver al inicio
        </Link>
      </motion.div>
    </div>
  );
}
