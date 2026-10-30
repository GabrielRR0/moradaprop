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
          {v.slider.bars.map((bar, $index) => (
            <span
              key={$index}
              style={{
                flex: '1',
                height: bar.height,
                background: bar.inRange ? 'var(--ac)' : 'var(--ac-soft)',
                opacity: bar.inRange ? '.55' : '1',
                borderRadius: '3px',
                transition: 'background .2s, opacity .2s, height .3s',
              }}
            />
          ))}
        </div>
        <div className="range">
          <span className="range-track" />
          <span
            className="range-fill"
            style={{ left: `${v.slider.leftPercent}%`, right: `${v.slider.rightPercent}%` }}
          />
          <input
            type="range"
            min={0}
            max={v.slider.max}
            step={v.slider.step}
            value={v.slider.minValue}
            onChange={v.slider.onMin}
            aria-label="Precio mínimo"
          />
          <input
            type="range"
            min={0}
            max={v.slider.max}
            step={v.slider.step}
            value={v.slider.maxValue}
            onChange={v.slider.onMax}
            aria-label="Precio máximo"
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
              <span style={{ fontWeight: '800', fontSize: '17px' }}>Ubicación</span>
              <select
                className="sel"
                value={v.state}
                onChange={v.chooseState}
                aria-label="Estado"
              >
                <option value="">Todos los estados</option>
                {v.states.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
              <select
                className="sel"
                value={v.municipality}
                onChange={v.chooseMunicipality}
                disabled={!v.state}
                aria-label="Municipio"
              >
                <option value="">{v.state ? 'Todos los municipios' : 'Elige un estado primero'}</option>
                {v.municipalities.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
            </section>
            <section style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <span style={{ fontWeight: '800', fontSize: '17px' }}>Estacionamiento</span>
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
            </section>
          </div>
        </>
      )}
    </div>
  );
}
