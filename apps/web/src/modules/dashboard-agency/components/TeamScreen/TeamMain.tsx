'use client';
import { Fragment } from 'react';
import { css } from '@/lib/dc';
import { Icon } from '@/components/icons';
import type { TeamScreenView } from '../../hooks/useTeamScreen';

export function TeamMain({ v }: { v: TeamScreenView }) {
  return (
    <main
      style={{
        flex: '1 1 auto',
        minWidth: '0',
        display: 'flex',
        flexDirection: 'column',
        padding: '30px 40px',
        gap: '24px',
        overflow: 'hidden',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <h1
            style={{ margin: '0', fontSize: '30px', fontWeight: '800', letterSpacing: '-0.03em' }}
          >
            Equipo
          </h1>
          <p style={{ margin: '0', fontSize: '15px', color: 'var(--muted)' }}>
            Invita a tus agentes. Cada uno entra con su propio usuario y ve solo lo que le asignas.
          </p>
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
            padding: '12px 18px',
            borderRadius: '16px',
            background: 'var(--ac-soft)',
          }}
        >
          <span
            style={{ fontWeight: '800', fontSize: '14px', color: 'var(--ac-ink)' }}
          >{`${v.seatsUsed} de 5 lugares usados`}</span>
          <span
            style={{
              width: '120px',
              height: '8px',
              borderRadius: '4px',
              background: 'var(--surf)',
              overflow: 'hidden',
            }}
          >
            <span
              style={css(
                `display:block; height:100%; width:${v.seatsPercent}; background:var(--ac); border-radius:4px; transition:width .5s`,
              )}
            />
          </span>
        </div>
      </div>
      <div style={{ flex: '1 1 auto', minHeight: '0', display: 'flex', gap: '24px' }}>
        <section
          style={{
            flex: '1 1 auto',
            minWidth: '0',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            overflowY: 'auto',
            paddingRight: '4px',
          }}
        >
          {v.members.map((m, $index) => (
            <Fragment key={$index}>
              <div className="mem">
                <span
                  style={css(
                    `flex:0 0 52px; height:52px; border-radius:50%; background:${m.color}; color:#fff; display:grid; place-items:center; font-weight:800; font-size:17px`,
                  )}
                >{`${m.initials}`}</span>
                <span
                  style={{
                    flex: '1',
                    minWidth: '0',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '2px',
                  }}
                >
                  <span style={{ fontWeight: '800', fontSize: '16px' }}>{`${m.name}`}</span>
                  <span style={{ fontSize: '13px', color: 'var(--muted)' }}>{`${m.email}`}</span>
                </span>
                <span style={{ flex: '0 0 120px', display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontWeight: '800', fontSize: '15px' }}>{`${m.properties}`}</span>
                  <span style={{ fontSize: '12px', color: 'var(--muted)' }}>propiedades</span>
                </span>
                <span style={{ flex: '0 0 100px', display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontWeight: '800', fontSize: '15px' }}>{`${m.leads}`}</span>
                  <span style={{ fontSize: '12px', color: 'var(--muted)' }}>leads activos</span>
                </span>
                <span style={{ flex: '0 0 150px' }}>
                  <span
                    style={css(
                      `${m.statusStyle}; display:inline-flex; align-items:center; gap:6px; min-height:30px; padding:0 12px; border-radius:999px; font-size:12px; font-weight:800`,
                    )}
                  >{`${m.statusLabel}`}</span>
                </span>
                <button className="role" onClick={m.changeRole} title="Cambiar rol" type="button">
                  {`${m.role}`}
                  <Icon name="chevron-down" size={12} strokeWidth={3} />
                </button>
              </div>
            </Fragment>
          ))}
        </section>
        <aside
          style={{
            flex: '0 0 420px',
            display: 'flex',
            flexDirection: 'column',
            gap: '18px',
            overflowY: 'auto',
          }}
        >
          <div className="card">
            <span style={{ fontWeight: '800', fontSize: '19px' }}>Invitar a un agente</span>
            <label className="fld">
              <span className="l">Correo del agente</span>
              <span className="box">
                <input
                  type="text"
                  placeholder="agente@correo.com"
                  value={v.email}
                  onChange={v.onEmailChange}
                />
              </span>
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <span style={{ fontSize: '13px', fontWeight: '700' }}>Rol</span>
              <div
                style={{
                  display: 'flex',
                  padding: '4px',
                  borderRadius: '14px',
                  background: 'var(--surf2)',
                  border: '1px solid var(--line)',
                }}
              >
                <button className={v.agentButtonClass} onClick={v.chooseAgent} type="button">
                  Agente
                </button>
                <button className={v.adminButtonClass} onClick={v.chooseAdmin} type="button">
                  Administrador
                </button>
              </div>
            </div>
            <button className="btn" onClick={v.sendInvitation} type="button">
              Enviar invitación
            </button>
            <span style={{ fontSize: '12px', lineHeight: '1.5', color: 'var(--muted)' }}>
              Le llegará un correo para crear su contraseña. Podrás quitarle el acceso cuando
              quieras.
            </span>
          </div>
          <div className="card" style={{ gap: '6px' }}>
            <span style={{ fontWeight: '800', fontSize: '17px', marginBottom: '6px' }}>
              ¿Qué puede hacer cada rol?
            </span>
            <div
              className="perm"
              style={{
                fontSize: '12px',
                fontWeight: '800',
                color: 'var(--muted)',
                textTransform: 'uppercase',
                letterSpacing: '.04em',
              }}
            >
              <span />
              <span style={{ textAlign: 'center' }}>Agente</span>
              <span style={{ textAlign: 'center' }}>Admin</span>
            </div>
            {v.permissions.map((p, $index) => (
              <Fragment key={$index}>
                <div className="perm">
                  <span>{`${p.label}`}</span>
                  <span
                    style={css(`text-align:center; font-weight:800; color:${p.agentColor}`)}
                  >{`${p.agentAccess}`}</span>
                  <span style={{ textAlign: 'center', fontWeight: '800', color: 'var(--ac-ink)' }}>
                    Sí
                  </span>
                </div>
              </Fragment>
            ))}
          </div>
        </aside>
      </div>
    </main>
  );
}
