'use client';
import Link from 'next/link';
import { Icon } from '@/components/icons';
import { MotionSupport } from '@/support/motion';
import { useInbox, type InboxTab } from '../../hooks/useInbox';
import { RefreshButton, Shell } from '../shared/Shell';

const TABS: Array<{ id: InboxTab; label: string }> = [
  { id: 'received', label: 'Recibidos' },
  { id: 'sent', label: 'Enviados' },
];

/** Bandeja de mensajes: lo que me escribieron los interesados y lo que yo le escribí a los anunciantes. */
export function InboxScreen() {
  const v = useInbox();
  const unread = { received: v.unreadReceived, sent: v.unreadSent };

  return (
    <Shell title="Mensajes" subtitle="Tus conversaciones con anunciantes e interesados" back="/" backLabel="Volver al inicio" actions={
        <>
          {v.publishes && (
            <Link href="/mensajes/respuestas" className="ib-refresh">
              <Icon name="clipboard" size={18} />
              <span>Respuestas</span>
            </Link>
          )}
          <RefreshButton onClick={v.refresh} busy={v.refreshing} />
        </>
      }
    >
      {v.publishes && (
        <div className="ib-tabs" role="tablist">
          {TABS.map((tab) => (
            <button key={tab.id} type="button" role="tab" aria-selected={v.tab === tab.id} className={v.tab === tab.id ? 'ib-tab on' : 'ib-tab'} onClick={() => v.setTab(tab.id)}>
              {v.tab === tab.id && <MotionSupport.motion.span layoutId="ib-tab-pill" className="ib-tab-pill" transition={{ type: 'spring', stiffness: 420, damping: 32 }} />}
              <span>{tab.label}</span>
              {unread[tab.id] > 0 && <b className="ib-count">{unread[tab.id]}</b>}
            </button>
          ))}
        </div>
      )}

      {v.loading && (
        <ul className="ib-list" aria-busy="true">
          {[0, 1, 2].map((n) => (
            <li key={n} className="ib-skel" />
          ))}
        </ul>
      )}

      {v.failed && (
        <div className="ib-empty">
          <Icon name="alert" size={30} />
          <p>No pudimos cargar tus mensajes.</p>
          <button type="button" className="ib-btn" onClick={v.refresh}>
            Reintentar
          </button>
        </div>
      )}

      {!v.loading && !v.failed && v.rows.length === 0 && (
        <MotionSupport.motion.div className="ib-empty" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <span className="ib-empty-ico">
            <Icon name="message" size={30} />
          </span>
          <h2>{v.tab === 'received' ? 'Aún nadie te ha escrito' : 'Todavía no has escrito a nadie'}</h2>
          <p>
            {v.tab === 'received'
              ? 'Cuando un interesado te escriba desde una de tus propiedades, su mensaje aparecerá aquí.'
              : 'Abre una propiedad y toca “Estoy interesado”, “Tengo una pregunta” o “Pedir una visita”.'}
          </p>
          {v.tab === 'sent' && (
            <Link href="/mapa" className="ib-btn">
              Buscar propiedades
            </Link>
          )}
        </MotionSupport.motion.div>
      )}

      <ul className="ib-list">
        {v.rows.map((row, index) => (
          <MotionSupport.motion.li key={row.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(index, 8) * 0.04 }}>
            <Link href={row.href} className={row.unread ? 'ib-item unread' : 'ib-item'}>
              <span className="ib-thumb">
                {row.thumb ? <img src={row.thumb} alt="" /> : <Icon name="home" size={22} />}
                {row.unread && <i className="ib-dot" aria-label="Mensaje nuevo" />}
              </span>
              <span className="ib-item-body">
                <span className="ib-item-top">
                  <b>{row.title}</b>
                  <small>{row.ago}</small>
                </span>
                <span className="ib-item-who">{`${row.who} · ${row.type}`}</span>
                <span className="ib-item-preview">{row.preview}</span>
                <span className="ib-item-tags">
                  <em className={`ib-tag ${row.tone}`}>{row.status}</em>
                  {row.visit && (
                    <em className="ib-tag visit">
                      <Icon name="calendar" size={12} />
                      {row.visit}
                    </em>
                  )}
                </span>
              </span>
            </Link>
          </MotionSupport.motion.li>
        ))}
      </ul>
    </Shell>
  );
}
