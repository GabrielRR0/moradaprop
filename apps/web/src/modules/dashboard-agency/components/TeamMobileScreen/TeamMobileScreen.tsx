'use client';
import { Fragment } from 'react';
import { css } from '@/lib/dc';
import './teammobilescreen.css';
import { useTeamMobileScreen } from '../../hooks/useTeamMobileScreen';
import { Icon } from '@/components/icons';
import { AgencyTabBar } from '../shared/AgencyTabBar';

export function TeamMobileScreen() {
  const v = useTeamMobileScreen();
  return (
    <div
      className="ds-teammobilescreen"
      style={{
        position: 'relative',
        width: '100%',
        height: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--bg)',
        color: 'var(--text)',
        fontFamily: "'Plus Jakarta Sans',system-ui,sans-serif",
        overflow: 'hidden',
        maxWidth: '560px',
        margin: '0 auto',
      }}
    >
      <header
        style={{
          flex: '0 0 auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          padding: '16px 16px 14px',
          borderBottom: '1px solid var(--line)',
        }}
      >
        <span style={{ fontWeight: '800', fontSize: '26px', letterSpacing: '-0.03em' }}>
          Equipo
        </span>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '12px 14px',
            borderRadius: '16px',
            background: 'var(--ac-soft)',
          }}
        >
          <span
            style={{
              fontWeight: '800',
              fontSize: '13px',
              color: 'var(--ac-ink)',
              whiteSpace: 'nowrap',
            }}
          >{`${v.seatsUsed} de 5 lugares`}</span>
          <span
            style={{
              flex: '1',
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
      </header>
      <div
        style={{
          flex: '1 1 auto',
          overflowY: 'auto',
          padding: '14px 16px 20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
        }}
      >
        {v.members.map((m, $index) => (
          <Fragment key={$index}>
            <div className="mem">
              <span
                style={css(
                  `flex:0 0 48px; height:48px; border-radius:50%; background:${m.color}; color:#fff; display:grid; place-items:center; font-weight:800; font-size:16px`,
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
                <span style={{ fontSize: '12px', color: 'var(--muted)' }}>{`${m.subtitle}`}</span>
              </span>
              <button className="role" onClick={m.changeRole} type="button">
                {`${m.role}`}
                <Icon name="chevron-down" size={12} strokeWidth={3} />
              </button>
            </div>
          </Fragment>
        ))}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            marginTop: '8px',
            padding: '18px',
            borderRadius: '22px',
            border: '1px solid var(--line)',
            background: 'var(--surf2)',
          }}
        >
          <span style={{ fontWeight: '800', fontSize: '18px' }}>Invitar a un agente</span>
          <label className="fld">
            <span className="box">
              <input
                type="text"
                placeholder="agente@correo.com"
                value={v.email}
                onChange={v.onEmailChange}
                aria-label="Correo del agente"
              />
            </span>
          </label>
          <div
            style={{
              display: 'flex',
              padding: '4px',
              borderRadius: '14px',
              background: 'var(--surf)',
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
          <button className="btn" onClick={v.sendInvitation} type="button">
            Enviar invitación
          </button>
          <span style={{ fontSize: '12px', lineHeight: '1.5', color: 'var(--muted)' }}>
            Le llega un correo para crear su contraseña. Puedes quitarle el acceso cuando quieras.
          </span>
        </div>
      </div>
      <AgencyTabBar active="equipo" />
    </div>
  );
}
