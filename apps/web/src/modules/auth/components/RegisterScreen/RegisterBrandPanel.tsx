'use client';
import Link from 'next/link';
import { brand } from '@/config';
import { Icon } from '@/components/icons';
import type { RegisterScreenView } from '../../hooks/useRegisterScreen';

export function RegisterBrandPanel({ v }: { v: RegisterScreenView }) {
  return (
    <aside
      style={{
        flex: '0 0 560px',
        position: 'relative',
        background: 'var(--ac)',
        color: '#fff',
        padding: '48px',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      <span
        style={{
          position: 'absolute',
          right: '-120px',
          top: '-120px',
          width: '420px',
          height: '420px',
          borderRadius: '50%',
          background: 'rgba(255,255,255,.1)',
        }}
      />
      <span
        style={{
          position: 'absolute',
          left: '-140px',
          bottom: '-160px',
          width: '480px',
          height: '480px',
          borderRadius: '50%',
          background: 'rgba(255,255,255,.08)',
        }}
      />
      <Link
        href="/"
        style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          fontWeight: '800',
          fontSize: '20px',
          letterSpacing: '-0.02em',
        }}
      >
        <span
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '12px',
            background: '#fff',
            color: 'var(--ac)',
            display: 'grid',
            placeItems: 'center',
          }}
        >
          <Icon name="home" size={22} />
        </span>
        {` ${brand.name} `}
      </Link>
      <div
        style={{
          position: 'relative',
          marginTop: '96px',
          display: 'flex',
          flexDirection: 'column',
          gap: '22px',
        }}
      >
        <h1
          style={{
            margin: '0',
            fontSize: '44px',
            lineHeight: '1.1',
            fontWeight: '800',
            letterSpacing: '-0.03em',
          }}
        >{`${v.headline}`}</h1>
        <p
          style={{ margin: '0', fontSize: '17px', lineHeight: '1.55', opacity: '.92' }}
        >{`${v.subtitle}`}</p>
      </div>
      <div
        style={{
          position: 'relative',
          marginTop: '44px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
            fontWeight: '600',
            fontSize: '16px',
          }}
        >
          <span
            style={{
              width: '30px',
              height: '30px',
              borderRadius: '50%',
              background: 'rgba(255,255,255,.2)',
              display: 'grid',
              placeItems: 'center',
            }}
          >
            <Icon name="check" size={16} strokeWidth={3.2} />
          </span>
          {`${v.benefit1}`}
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
            fontWeight: '600',
            fontSize: '16px',
          }}
        >
          <span
            style={{
              width: '30px',
              height: '30px',
              borderRadius: '50%',
              background: 'rgba(255,255,255,.2)',
              display: 'grid',
              placeItems: 'center',
            }}
          >
            <Icon name="check" size={16} strokeWidth={3.2} />
          </span>
          {`${v.benefit2}`}
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
            fontWeight: '600',
            fontSize: '16px',
          }}
        >
          <span
            style={{
              width: '30px',
              height: '30px',
              borderRadius: '50%',
              background: 'rgba(255,255,255,.2)',
              display: 'grid',
              placeItems: 'center',
            }}
          >
            <Icon name="check" size={16} strokeWidth={3.2} />
          </span>
          {`${v.benefit3}`}
        </div>
      </div>
      <div
        className="float"
        style={{
          position: 'absolute',
          left: '48px',
          bottom: '56px',
          display: 'flex',
          alignItems: 'center',
          gap: '14px',
          padding: '14px 18px',
          borderRadius: '20px',
          background: '#fff',
          color: '#0F1420',
          boxShadow: '0 24px 50px rgba(0,0,0,.25)',
        }}
      >
        <span
          style={{
            width: '48px',
            height: '48px',
            borderRadius: '14px',
            background: '#E3F4EA',
            color: '#14633A',
            display: 'grid',
            placeItems: 'center',
          }}
        >
          <Icon name="whatsapp" />
        </span>
        <span style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontWeight: '800', fontSize: '15px' }}>Nuevo interesado</span>
          <span style={{ fontSize: '13px', color: '#566073' }}>Escribió por WhatsApp</span>
        </span>
      </div>
      <div
        className="float2"
        style={{
          position: 'absolute',
          right: '48px',
          bottom: '150px',
          padding: '12px 18px',
          borderRadius: '999px',
          background: '#fff',
          color: '#0F1420',
          fontWeight: '800',
          fontSize: '15px',
          boxShadow: '0 24px 50px rgba(0,0,0,.25)',
        }}
      >
        Publicada hace 3 min
      </div>
    </aside>
  );
}
