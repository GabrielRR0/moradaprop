'use client';
import Link from 'next/link';
import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { formatPrice } from '@/lib/properties';
import { useRentMap } from '../../hooks/useRentMap';

/** Variables de estilo propias (color, retraso, etc.) que React no conoce como propiedades. */
const vars = (values: Record<string, string>) => values as CSSProperties;

/** Número que sube (o baja) desde el valor anterior hasta el nuevo; sin movimiento si se pidió menos animación. */
function CountUp({ value, run }: { value: number; run: boolean }) {
  const [shown, setShown] = useState(0);
  const from = useRef(0);
  useEffect(() => {
    if (!run) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      from.current = value;
      setShown(value);
      return;
    }
    const start = performance.now();
    const origin = from.current;
    let frame = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / 800);
      const next = Math.round(origin + (value - origin) * (1 - Math.pow(1 - t, 3)));
      from.current = next;
      setShown(next);
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [run, value]);
  return <>{formatPrice(run ? shown : 0)}</>;
}

/**
 * "¿Cuánto cuesta alquilar?": una ciudad destacada (precio típico, cómo se reparten los precios y el rango)
 * y un ranking de todas con una escala común, pintado de verde (barato) a rojo (caro).
 * Diseño: lienzo "Cuánto cuesta alquilar". Al llegar a la sección todo se anima.
 */
export function HomeRentMap() {
  const v = useRentMap();
  const ref = useRef<HTMLElement>(null);
  const [seen, setSeen] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setSeen(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const spot = v.spot;
  return (
    <section
      ref={ref}
      id="precios"
      className={seen ? 'hm-pad hm-rent hm-rent-seen' : 'hm-pad hm-rent'}
      style={{
        padding: '0 48px 80px',
        maxWidth: '1440px',
        width: '100%',
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '32px',
      }}
    >
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          gap: '24px',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxWidth: '640px' }}>
          <span
            style={{
              alignSelf: 'flex-start',
              padding: '6px 14px',
              borderRadius: '999px',
              background: 'var(--ac-soft)',
              color: 'var(--ac-ink)',
              fontSize: '13px',
              fontWeight: '800',
            }}
          >
            Precios reales · de todas las propiedades publicadas
          </span>
          <h2
            className="hm-h2"
            style={{ margin: '0', fontSize: '40px', fontWeight: '800', letterSpacing: '-0.03em' }}
          >
            ¿Cuánto cuesta alquilar en Venezuela?
          </h2>
          <p style={{ margin: '0', fontSize: '17px', color: 'var(--muted)', lineHeight: '1.55' }}>
            Toca una ciudad para ver cuánto pagan los inquilinos, de verde (económico) a rojo (caro).
          </p>
        </div>
        <div className="hm-rent-seg" role="group" aria-label="Ordenar ciudades">
          <button
            type="button"
            className={v.order === 'cheap' ? 'on' : ''}
            onClick={v.chooseCheap}
            aria-pressed={v.order === 'cheap'}
          >
            Más económicas
          </button>
          <button
            type="button"
            className={v.order === 'expensive' ? 'on' : ''}
            onClick={v.chooseExpensive}
            aria-pressed={v.order === 'expensive'}
          >
            Más caras
          </button>
        </div>
      </div>

      {v.failed ? (
        <div className="hm-state">
          <b>No pudimos cargar los precios.</b>
          <button className="btn2" type="button" onClick={v.retry}>
            Reintentar
          </button>
        </div>
      ) : v.empty ? (
        <div className="hm-state">
          <b>Todavía no hay suficientes propiedades para calcular precios.</b>
        </div>
      ) : (
        <>
          <div className="hm-rent-chips" role="group" aria-label="Ciudades">
            {v.chips.map((chip) => (
              <button
                key={chip.key}
                type="button"
                className={chip.pressed ? 'on' : ''}
                aria-pressed={chip.pressed}
                onClick={chip.pick}
                style={vars({ '--c': chip.color })}
              >
                <i />
                {chip.city}
              </button>
            ))}
          </div>

          <div className="hm-rent-wrap">
            {v.loading || !spot ? (
              <div className="hm-skel" style={{ flex: '1 1 400px', maxWidth: 480, minHeight: 520 }} />
            ) : (
              <div className="hm-rent-spot" style={vars({ '--c': spot.color })}>
                <div className="hm-rent-spot-top">
                  <span className="hm-rent-kicker">Alquiler típico</span>
                  <span className="hm-rent-verdict">{spot.verdict}</span>
                </div>
                <div className="hm-rent-city">
                  <b>{spot.city}</b>
                  <span>
                    {spot.state} · {spot.count} propiedades
                  </span>
                </div>
                <div className="hm-rent-big">
                  <strong aria-label={formatPrice(spot.price)}>
                    <CountUp value={spot.price} run={seen} />
                  </strong>
                  <span>/mes</span>
                </div>
                <div>
                  <div className="hm-rent-hist" aria-hidden="true">
                    {spot.bins.map((bin, index) => (
                      <span
                        key={index}
                        className={bin.inRange ? 'in' : ''}
                        style={vars({ '--h': bin.height, '--b': bin.color, '--bd': bin.delay })}
                      />
                    ))}
                  </div>
                  <div className="hm-rent-histcap">
                    <span>$0</span>
                    <span>Cómo se reparten los precios</span>
                    <span>$1.300</span>
                  </div>
                </div>
                <div className="hm-rent-stats">
                  <div>
                    <small>Desde</small>
                    <b>{spot.min}</b>
                  </div>
                  <div>
                    <small>La mayoría</small>
                    <b>{spot.range}</b>
                  </div>
                  <div>
                    <small>Hasta</small>
                    <b>{spot.max}</b>
                  </div>
                </div>
                <Link href={spot.href} className="hm-rent-cta">
                  Ver propiedades en {spot.city}
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M5 12h14M13 6l6 6-6 6" />
                  </svg>
                </Link>
              </div>
            )}

            <div className="hm-rent-list">
              <div className="hm-rent-head" aria-hidden="true">
                <span />
                <span>Ciudad</span>
                <div className="hm-rent-axis">
                  {v.axis.map((tick) => (
                    <span
                      key={tick.value}
                      style={{
                        left: tick.left,
                        transform: `translateX(${tick.value === 0 ? '0' : tick.value === 1200 ? '-100%' : '-50%'})`,
                      }}
                    >
                      {tick.label}
                    </span>
                  ))}
                </div>
                <span style={{ textAlign: 'right' }}>Típico</span>
              </div>
              {v.loading &&
                [0, 1, 2, 3, 4].map((n) => (
                  <div key={n} className="hm-skel" style={{ minHeight: 58 }} />
                ))}
              {v.rows.map((row) => (
                <button
                  key={row.key}
                  type="button"
                  className={row.pressed ? 'hm-rent-row on' : 'hm-rent-row'}
                  aria-pressed={row.pressed}
                  onClick={row.pick}
                  style={vars({ '--c': row.color, '--d': row.delay })}
                >
                  <span className="hm-rent-rank">{row.rank}</span>
                  <span className="hm-rent-name">
                    <b>{row.city}</b>
                    <small>{row.state}</small>
                  </span>
                  <span className="hm-rent-bar" aria-hidden="true">
                    <span className="hm-rent-track" style={{ background: v.gradient }} />
                    <span
                      className="hm-rent-pill"
                      style={vars({ left: row.from, '--w': row.width })}
                    />
                    <span className="hm-rent-dot" style={vars({ '--l': row.marker })} />
                  </span>
                  <span className="hm-rent-price">{row.price}</span>
                </button>
              ))}
              <div className="hm-rent-legend">
                <span>
                  <i />
                  Dónde cae la mayoría de los precios
                </span>
                <span>
                  <i className="dot" />
                  Precio típico
                </span>
              </div>
            </div>
          </div>
        </>
      )}
    </section>
  );
}
