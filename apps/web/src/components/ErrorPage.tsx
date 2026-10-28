'use client';

import { motion } from 'motion/react';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { Icon } from '@/components/icons';
import './ui/ui.css';

/** Pagina de error a pantalla completa (404 y fallos inesperados). Entra con un resorte suave. */
export function ErrorPage({
  code,
  title,
  text,
  actions,
}: {
  /** "404", "500"... Si es "404" la O del medio es una casita. */
  code: string;
  title: string;
  text: string;
  actions: ReactNode;
}) {
  const digits = code.split('');
  return (
    <main className="ep ui-font">
      <motion.div
        className="ep-card"
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 24 }}
      >
        <div className="ep-code" aria-hidden="true">
          {digits.map((digit, index) =>
            code === '404' && index === 1 ? (
              <span key={index} className="ep-house">
                <Icon name="house" size={64} strokeWidth={2.2} style={{ width: '60%', height: '60%' }} />
              </span>
            ) : (
              <span key={index}>{digit}</span>
            ),
          )}
        </div>
        <h1>{title}</h1>
        <p>{text}</p>
        <div className="ep-actions">{actions}</div>
      </motion.div>
    </main>
  );
}

export function HomeLink() {
  return (
    <Link href="/" className="ui-btn">
      Ir al inicio
    </Link>
  );
}

export function MapLink() {
  return (
    <Link href="/mapa" className="ui-btn2">
      <Icon name="map" size={18} /> Explorar el mapa
    </Link>
  );
}
