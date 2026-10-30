'use client';

import Link from 'next/link';
import { css } from '@/lib/dc';
import { whatsappUrl } from '@/lib/whatsapp';
import type { PropertyCard } from '@/lib/properties';
import { badgeOf, formatPrice, photoTint, placeOf, specsOf } from '@/lib/properties';
import { Icon } from '@/components/icons';

/** Ficha flotante del diseno (`.pop`) que se abre sobre el pin elegido. */
export function PropertyPopup({
  property,
  onClose,
}: {
  property: PropertyCard;
  onClose: () => void;
}) {
  const badge = badgeOf(property);
  return (
    <div
      className="pop"
      role="dialog"
      aria-label={property.title}
      style={{ left: 0, top: 0, transform: 'translate(-50%, calc(-100% - 54px))' }}
    >
      <div
        style={{
          position: 'relative',
          height: 104,
          display: 'grid',
          placeItems: 'center',
          color: 'var(--ac-ink)',
          ...(property.cover
            ? null
            : css(photoTint(Math.abs(Math.round(property.latitude * 100))))),
        }}
      >
        {property.cover ? (
          <img
            src={property.cover.medium}
            alt=""
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
          />
        ) : (
          <Icon name="home" size={56} strokeWidth={1.2} />
        )}
        {badge && (
          <span
            style={{
              position: 'absolute',
              top: 8,
              left: 8,
              padding: '4px 10px',
              borderRadius: 999,
              background: 'var(--surf)',
              fontSize: 11,
              fontWeight: 800,
              color: 'var(--ac-ink)',
            }}
          >
            {badge}
          </span>
        )}
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar ficha"
          style={{
            position: 'absolute',
            top: 6,
            right: 6,
            width: 36,
            height: 36,
            borderRadius: '50%',
            border: 0,
            background: 'var(--surf)',
            color: 'var(--text)',
            display: 'grid',
            placeItems: 'center',
            boxShadow: '0 4px 12px rgba(15,20,32,.25)',
          }}
        >
          <Icon name="close" size={16} strokeWidth={2.6} />
        </button>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, padding: '12px 14px 14px' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
          <span style={{ fontWeight: 800, fontSize: 20, letterSpacing: '-0.02em' }}>
            {formatPrice(property.priceAmount, property.currency)}
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--muted)' }}> /mes</span>
          </span>
          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--ac-ink)' }}>Ver en Bs.</span>
        </div>
        <span
          style={{
            fontWeight: 700,
            fontSize: 14,
            lineHeight: 1.25,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {property.title}
        </span>
        <span style={{ fontSize: 12, lineHeight: 1.3, color: 'var(--muted)' }}>
          {[placeOf(property), specsOf(property)].filter(Boolean).join(' · ')}
        </span>
        <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
          <a
            href={whatsappUrl(`Hola, me interesa "${property.title}" en ${placeOf(property)}.`)}
            target="_blank"
            rel="noreferrer"
            className="btn"
            style={{ flex: 1, minHeight: 40, background: '#1F9D55' }}
          >
            <Icon name="whatsapp" size={18} />
            {' WhatsApp'}
          </a>
          <Link href={`/propiedad/${property.id}`} className="btn2" style={{ flex: 1, minHeight: 40 }}>
            Ver detalle
          </Link>
        </div>
      </div>
    </div>
  );
}
