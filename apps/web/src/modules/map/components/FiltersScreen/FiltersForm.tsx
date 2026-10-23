'use client';
import { Fragment } from 'react';
import { Icon } from '@/components/icons';
import type { FiltersScreenView } from '../../hooks/useFiltersScreen';

export function FiltersForm({ v }: { v: FiltersScreenView }) {
  return (
    <div
      style={{
        flex: '1 1 auto',
        overflowY: 'auto',
        padding: '8px 28px 24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '30px',
        borderTop: '1px solid var(--line)',
      }}
    >
      <section
        style={{ display: 'flex', flexDirection: 'column', gap: '14px', paddingTop: '20px' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontWeight: '800', fontSize: '17px' }}>Presupuesto mensual</span>
          <div
            style={{
              display: 'flex',
              padding: '3px',
              borderRadius: '10px',
              background: 'var(--surf2)',
              border: '1px solid var(--line)',
              width: '132px',
            }}
          >
            <button
              className={v.usdButtonClass}
              onClick={v.chooseUsd}
              style={{ minHeight: '34px' }}
              type="button"
            >
              USD
            </button>
            <button
              className={v.vesButtonClass}
              onClick={v.chooseVes}
              style={{ minHeight: '34px' }}
              type="button"
            >
              Bs.
            </button>
          </div>
        </div>
        <div
          style={{ display: 'flex', alignItems: 'flex-end', gap: '3px', height: '44px' }}
          aria-hidden="true"
        >
          <span
            style={{ flex: '1', height: '30%', background: 'var(--ac-soft)', borderRadius: '3px' }}
          />
          <span
            style={{ flex: '1', height: '50%', background: 'var(--ac-soft)', borderRadius: '3px' }}
          />
          <span
            style={{
              flex: '1',
              height: '80%',
              background: 'var(--ac)',
              opacity: '.55',
              borderRadius: '3px',
            }}
          />
          <span
            style={{
              flex: '1',
              height: '100%',
              background: 'var(--ac)',
              opacity: '.55',
              borderRadius: '3px',
            }}
          />
          <span
            style={{
              flex: '1',
              height: '70%',
              background: 'var(--ac)',
              opacity: '.55',
              borderRadius: '3px',
            }}
          />
          <span
            style={{
              flex: '1',
              height: '55%',
              background: 'var(--ac)',
              opacity: '.55',
              borderRadius: '3px',
            }}
          />
          <span
            style={{ flex: '1', height: '40%', background: 'var(--ac-soft)', borderRadius: '3px' }}
          />
          <span
            style={{ flex: '1', height: '25%', background: 'var(--ac-soft)', borderRadius: '3px' }}
          />
          <span
            style={{ flex: '1', height: '15%', background: 'var(--ac-soft)', borderRadius: '3px' }}
          />
          <span
            style={{ flex: '1', height: '10%', background: 'var(--ac-soft)', borderRadius: '3px' }}
          />
        </div>
        <div style={{ position: 'relative', height: '28px' }} aria-hidden="true">
          <span
            style={{
              position: 'absolute',
              left: '0',
              right: '0',
              top: '12px',
              height: '4px',
              borderRadius: '2px',
              background: 'var(--line)',
            }}
          />
          <span
            style={{
              position: 'absolute',
              left: '18%',
              right: '34%',
              top: '12px',
              height: '4px',
              borderRadius: '2px',
              background: 'var(--ac)',
            }}
          />
          <span
            style={{
              position: 'absolute',
              left: '18%',
              top: '2px',
              width: '24px',
              height: '24px',
              marginLeft: '-12px',
              borderRadius: '50%',
              background: 'var(--surf)',
              border: '3px solid var(--ac)',
              boxShadow: '0 3px 8px rgba(15,20,32,.25)',
            }}
          />
          <span
            style={{
              position: 'absolute',
              left: '66%',
              top: '2px',
              width: '24px',
              height: '24px',
              marginLeft: '-12px',
              borderRadius: '50%',
              background: 'var(--surf)',
              border: '3px solid var(--ac)',
              boxShadow: '0 3px 8px rgba(15,20,32,.25)',
            }}
          />
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <label
            style={{
              flex: '1',
              display: 'flex',
              flexDirection: 'column',
              gap: '2px',
              padding: '10px 16px',
              borderRadius: '14px',
              border: '1px solid var(--line)',
            }}
          >
            <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--muted)' }}>
              Mínimo
            </span>
            <input
              type="text"
              value={v.minText}
              onChange={v.onMinChange}
              inputMode="numeric"
              placeholder="Sin mínimo"
              aria-label="Precio mínimo"
              style={{
                border: '0',
                outline: '0',
                background: 'transparent',
                fontWeight: '800',
                fontSize: '18px',
                width: '100%',
              }}
            />
          </label>
          <label
            style={{
              flex: '1',
              display: 'flex',
              flexDirection: 'column',
              gap: '2px',
              padding: '10px 16px',
              borderRadius: '14px',
              border: '1px solid var(--line)',
            }}
          >
            <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--muted)' }}>
              Máximo
            </span>
            <input
              type="text"
              value={v.maxText}
              onChange={v.onMaxChange}
              inputMode="numeric"
              placeholder="Sin máximo"
              aria-label="Precio máximo"
              style={{
                border: '0',
                outline: '0',
                background: 'transparent',
                fontWeight: '800',
                fontSize: '18px',
                width: '100%',
              }}
            />
          </label>
        </div>
      </section>
      <section style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <span style={{ fontWeight: '800', fontSize: '17px' }}>Habitaciones</span>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {v.bedroomPills.map((b, $index) => (
            <Fragment key={$index}>
              <button
                className={b.className}
                onClick={b.choose}
                type="button"
              >{`${b.label}`}</button>
            </Fragment>
          ))}
        </div>
        <span style={{ fontWeight: '800', fontSize: '17px', marginTop: '6px' }}>Baños</span>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {v.bathroomPills.map((b, $index) => (
            <Fragment key={$index}>
              <button
                className={b.className}
                onClick={b.choose}
                type="button"
              >{`${b.label}`}</button>
            </Fragment>
          ))}
        </div>
      </section>
      <section style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
          <span style={{ fontWeight: '800', fontSize: '17px' }}>Servicios que necesito</span>
          <span style={{ fontSize: '13px', color: 'var(--muted)' }}>Pensado para Venezuela</span>
        </div>
        <div
          style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '10px' }}
        >
          {v.amenityCards.map((a, $index) => (
            <Fragment key={$index}>
              <button className={a.className} onClick={a.toggle} type="button">
                <Icon d={a.icon} strokeWidth={2} />
                {` ${a.label} `}
                <span className="box">
                  <Icon name="check" size={14} strokeWidth={3.4} />
                </span>
              </button>
            </Fragment>
          ))}
        </div>
      </section>
      {v.isAdvanced && (
        <>
          <div className="in" style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
            <section style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <span style={{ fontWeight: '800', fontSize: '17px' }}>Tipo de inmueble</span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {v.typeCards.map((t, $index) => (
                  <Fragment key={$index}>
                    <button
                      className={t.className}
                      onClick={t.choose}
                      type="button"
                    >{`${t.label}`}</button>
                  </Fragment>
                ))}
              </div>
            </section>
            <section style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <span style={{ fontWeight: '800', fontSize: '17px' }}>Ubicación exacta</span>
              <div className="sel">
                <span>Distrito Capital</span>
                <Icon name="chevron-down" size={16} strokeWidth={2.6} />
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <div className="sel" style={{ flex: '1' }}>
                  <span>Chacao</span>
                  <Icon name="chevron-down" size={16} strokeWidth={2.6} />
                </div>
                <div className="sel" style={{ flex: '1' }}>
                  <span style={{ color: 'var(--muted)' }}>Urbanización</span>
                  <Icon name="chevron-down" size={16} strokeWidth={2.6} />
                </div>
              </div>
            </section>
            <section style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <span style={{ fontWeight: '800', fontSize: '17px' }}>Estacionamiento y área</span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {v.parkingPills.map((b, $index) => (
                  <Fragment key={$index}>
                    <button
                      className={b.className}
                      onClick={b.choose}
                      type="button"
                    >{`${b.label}`}</button>
                  </Fragment>
                ))}
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <label
                  style={{
                    flex: '1',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '2px',
                    padding: '10px 16px',
                    borderRadius: '14px',
                    border: '1px solid var(--line)',
                  }}
                >
                  <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--muted)' }}>
                    Área mínima (m²)
                  </span>
                  <input
                    type="text"
                    defaultValue="40"
                    style={{
                      border: '0',
                      outline: '0',
                      background: 'transparent',
                      fontWeight: '800',
                      fontSize: '18px',
                      width: '100%',
                    }}
                  />
                </label>
                <label
                  style={{
                    flex: '1',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '2px',
                    padding: '10px 16px',
                    borderRadius: '14px',
                    border: '1px solid var(--line)',
                  }}
                >
                  <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--muted)' }}>
                    Disponible desde
                  </span>
                  <input
                    type="text"
                    defaultValue="Cualquier fecha"
                    style={{
                      border: '0',
                      outline: '0',
                      background: 'transparent',
                      fontWeight: '800',
                      fontSize: '16px',
                      width: '100%',
                    }}
                  />
                </label>
              </div>
            </section>
          </div>
        </>
      )}
    </div>
  );
}
