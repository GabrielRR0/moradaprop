'use client';
import Link from 'next/link';
import { brand } from '@/config';
import { useTheme } from '@/lib/theme';
import './homescreen.css';
import { useHomeScreen } from '../../hooks/useHomeScreen';
import { HomeIntro } from './HomeIntro';
import { HomeListings } from './HomeListings';
import { HomeRentMap } from './HomeRentMap';
import { Icon } from '@/components/icons';
import { useSession } from '@/modules/auth';

export function HomeScreen() {
  const v = useHomeScreen();
  const { status, user } = useSession();
  const { toggleDark } = useTheme();
  return (
    <div
      className="ds-homescreen"
      style={{
        width: '100%',
        background: 'var(--bg)',
        color: 'var(--text)',
        fontFamily: "'Plus Jakarta Sans',system-ui,sans-serif",
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <header
        className="hm-header"
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
          padding: '18px 48px',
          borderBottom: '1px solid var(--line)',
          background: 'var(--bg)',
        }}
      >
        <Link
          href="/"
          className="hm-brand"
          style={{
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
              width: '38px',
              height: '38px',
              borderRadius: '12px',
              background: 'var(--ac)',
              display: 'grid',
              placeItems: 'center',
              color: '#fff',
            }}
          >
            <Icon name="home" size={22} />
          </span>
          {` ${brand.name} `}
        </Link>
        <nav
          className="hm-nav"
          style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '6px' }}
        >
          <Link
            href="/mapa"
            className="chip"
            style={{ borderColor: 'transparent', background: 'transparent' }}
          >
            Alquilar
          </Link>
          <Link
            href="/"
            className="chip"
            style={{ borderColor: 'transparent', background: 'transparent' }}
          >
            Publicar
          </Link>
          <Link
            href="/"
            className="chip"
            style={{ borderColor: 'transparent', background: 'transparent' }}
          >
            Inmobiliarias
          </Link>
          <Link
            href="/"
            className="chip"
            style={{ borderColor: 'transparent', background: 'transparent' }}
          >
            Ayuda
          </Link>
        </nav>
        <div
          className="hm-actions"
          style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '10px' }}
        >
          <button
            className="btn2"
            aria-label="Cambiar entre USD y bolívares"
            style={{ fontWeight: '700' }}
            type="button"
          >
            USD
            <span style={{ color: 'var(--muted)' }}>{' / Bs.'}</span>
          </button>
          <button
            className="btn2"
            aria-label="Cambiar modo claro u oscuro"
            style={{ width: '44px', padding: '0' }}
            type="button"
            onClick={toggleDark}
          >
            <Icon name="moon" size={20} strokeWidth={2} />
          </button>
          {user?.roles.includes('ADMIN') && (
            <Link href="/admin/ajustes" className="btn2">
              Ajustes
            </Link>
          )}
          {status === 'authed' && (
            <Link href="/mensajes" className="btn2">
              Mensajes
            </Link>
          )}
          <Link href={status === 'authed' ? '/seguridad' : '/ingresar'} className="btn2">
            {status === 'authed' ? 'Mi cuenta' : 'Ingresar'}
          </Link>
          <Link href="/publicar" className="btn hm-publish">
            Publicar gratis
          </Link>
        </div>
      </header>
      <HomeIntro v={v} />
      <section
        className="hm-pad"
        style={{
          padding: '24px 48px 72px',
          maxWidth: '1440px',
          width: '100%',
          margin: '0 auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '28px',
        }}
        data-reveal=""
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <h2
            className="hm-h2"
            style={{ margin: '0', fontSize: '36px', fontWeight: '800', letterSpacing: '-0.025em' }}
          >
            Busca por lo que importa
          </h2>
          <p style={{ margin: '0', fontSize: '17px', color: 'var(--muted)' }}>
            Los servicios que marcan la diferencia en el día a día, a un toque.
          </p>
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '20px',
          }}
        >
          <Link href="/mapa" className="tile">
            <span className="ico">
              <Icon name="bolt" size={28} strokeWidth={2} />
            </span>
            <span style={{ fontWeight: '800', fontSize: '19px' }}>Planta eléctrica</span>
            <span style={{ fontSize: '14px', color: 'var(--muted)', lineHeight: '1.5' }}>
              Sin apagones: respaldo propio o del edificio.
            </span>
          </Link>
          <Link href="/mapa" className="tile">
            <span className="ico">
              <Icon name="droplet" size={28} strokeWidth={2} />
            </span>
            <span style={{ fontWeight: '800', fontSize: '19px' }}>Agua constante</span>
            <span style={{ fontSize: '14px', color: 'var(--muted)', lineHeight: '1.5' }}>
              Tanque o hidroneumático con suministro.
            </span>
          </Link>
          <Link href="/mapa" className="tile">
            <span className="ico">
              <Icon name="wifi" size={28} strokeWidth={2} />
            </span>
            <span style={{ fontWeight: '800', fontSize: '19px' }}>Fibra óptica</span>
            <span style={{ fontSize: '14px', color: 'var(--muted)', lineHeight: '1.5' }}>
              Internet rápido para trabajar desde casa.
            </span>
          </Link>
          <Link href="/mapa" className="tile">
            <span className="ico">
              <Icon name="shield" size={28} strokeWidth={2} />
            </span>
            <span style={{ fontWeight: '800', fontSize: '19px' }}>Vigilancia 24h</span>
            <span style={{ fontSize: '14px', color: 'var(--muted)', lineHeight: '1.5' }}>
              Conjuntos y edificios con seguridad.
            </span>
          </Link>
        </div>
      </section>
      <HomeListings v={v} />
      <HomeRentMap />
      <section
        style={{
          background: 'var(--surf2)',
          borderTop: '1px solid var(--line)',
          borderBottom: '1px solid var(--line)',
        }}
        data-reveal=""
      >
        <div
          style={{
            padding: '72px 48px',
            maxWidth: '1440px',
            width: '100%',
            margin: '0 auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '36px',
          }}
        >
          <h2
            className="hm-h2"
            style={{ margin: '0', fontSize: '36px', fontWeight: '800', letterSpacing: '-0.025em' }}
          >
            Alquilar es así de fácil
          </h2>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
              gap: '24px',
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <span
                style={{
                  width: '52px',
                  height: '52px',
                  borderRadius: '50%',
                  background: 'var(--ac)',
                  color: '#fff',
                  display: 'grid',
                  placeItems: 'center',
                  fontWeight: '800',
                  fontSize: '20px',
                }}
              >
                1
              </span>
              <span style={{ fontWeight: '800', fontSize: '21px' }}>Explora el mapa</span>
              <span style={{ fontSize: '15px', lineHeight: '1.6', color: 'var(--muted)' }}>
                Mueve el mapa y mira dónde hay propiedades. Cada pin muestra el precio.
              </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <span
                style={{
                  width: '52px',
                  height: '52px',
                  borderRadius: '50%',
                  background: 'var(--ac)',
                  color: '#fff',
                  display: 'grid',
                  placeItems: 'center',
                  fontWeight: '800',
                  fontSize: '20px',
                }}
              >
                2
              </span>
              <span style={{ fontWeight: '800', fontSize: '21px' }}>Escribe por WhatsApp</span>
              <span style={{ fontSize: '15px', lineHeight: '1.6', color: 'var(--muted)' }}>
                Habla directo con el dueño o la inmobiliaria, o agenda una visita.
              </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <span
                style={{
                  width: '52px',
                  height: '52px',
                  borderRadius: '50%',
                  background: 'var(--ac)',
                  color: '#fff',
                  display: 'grid',
                  placeItems: 'center',
                  fontWeight: '800',
                  fontSize: '20px',
                }}
              >
                3
              </span>
              <span style={{ fontWeight: '800', fontSize: '21px' }}>Aparta tu hogar</span>
              <span style={{ fontSize: '15px', lineHeight: '1.6', color: 'var(--muted)' }}>
                Cuando te guste, aparta la propiedad y queda "en proceso de reserva".
              </span>
            </div>
          </div>
        </div>
      </section>
      <section
        className="hm-pad"
        style={{ padding: '72px 48px', maxWidth: '1440px', width: '100%', margin: '0 auto' }}
        data-reveal=""
      >
        <div
          className="hm-cta"
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '28px',
            padding: '48px',
            borderRadius: '32px',
            background: 'var(--ac)',
            color: '#fff',
          }}
        >
          <div style={{ flex: '1 1 380px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <h2
              className="hm-h2"
              style={{
                margin: '0',
                fontSize: '36px',
                fontWeight: '800',
                letterSpacing: '-0.025em',
              }}
            >
              ¿Tienes una propiedad para alquilar?
            </h2>
            <p style={{ margin: '0', fontSize: '17px', lineHeight: '1.55', opacity: '.92' }}>
              Publícala paso a paso en minutos. Si eres inmobiliaria, importa todo tu inventario
              desde Excel.
            </p>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
            <Link href="/" className="btn" style={{ background: '#fff', color: '#0F1420' }}>
              Publicar mi propiedad
            </Link>
            <Link
              href="/"
              className="btn"
              style={{ background: 'transparent', border: '2px solid #fff' }}
            >
              Soy inmobiliaria
            </Link>
          </div>
        </div>
      </section>
      <footer
        className="hm-pad"
        style={{
          padding: '28px 48px',
          borderTop: '1px solid var(--line)',
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          gap: '12px',
          fontSize: '14px',
          color: 'var(--muted)',
        }}
      >
        <span>{`© ${brand.name} · Alquileres en Venezuela`}</span>
        <span>Términos · Privacidad · Contacto</span>
      </footer>
    </div>
  );
}
