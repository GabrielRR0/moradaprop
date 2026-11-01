'use client';
import { Icon } from '@/components/icons';
import type { PropertyAvailability } from '@/lib/appointments';
import { MotionSupport } from '@/support/motion';
import type { ConversationView } from '../../hooks/useConversation';

const OPTIONS: Array<{ id: PropertyAvailability; label: string; hint: string }> = [
  { id: 'free', label: 'Disponible', hint: 'Recibe todo' },
  { id: 'reserved-open', label: 'Reservada', hint: 'Aún acepta citas' },
  { id: 'reserved-closed', label: 'Reservada del todo', hint: 'Sin más citas' },
];

/**
 * Lo que solo ve quien gestiona la propiedad: quién escribe, en qué estado dejar la propiedad
 * (disponible, reservada con citas o reservada del todo), proponer fechas y cerrar la conversación.
 */
export function ManagerPanel({ v, onPropose }: { v: ConversationView; onPropose: () => void }) {
  const thread = v.thread!;
  const contact = thread.contact;
  const editable = thread.property.status === 'PUBLICADA' || thread.property.status === 'RESERVADA';

  return (
    <section className="ib-manager" aria-label="Herramientas del anunciante">
      {contact && (
        <div className="ib-contact">
          <span className="ib-avatar">{contact.name.charAt(0).toUpperCase()}</span>
          <span className="ib-contact-text">
            <b>{contact.name}</b>
            <small>
              <a href={`mailto:${contact.email}`}>{contact.email}</a>
              {contact.phone && (
                <>
                  {' · '}
                  <a href={`https://wa.me/${contact.phone.replace(/\D/g, '')}`} target="_blank" rel="noreferrer">
                    {contact.phone}
                  </a>
                </>
              )}
            </small>
          </span>
        </div>
      )}

      {editable && (
        <div className="ib-avail">
          <span className="ib-avail-title">Estado de la propiedad</span>
          <div className="ib-seg" role="radiogroup" aria-label="Estado de la propiedad">
            {OPTIONS.map((option) => {
              const on = option.id === v.availability;
              return (
                <button key={option.id} type="button" role="radio" aria-checked={on} className={on ? 'ib-seg-btn on' : 'ib-seg-btn'} disabled={v.changingAvailability} onClick={() => !on && v.changeAvailability(option.id)}>
                  {on && <MotionSupport.motion.span layoutId="ib-avail-pill" className="ib-seg-pill" transition={{ type: 'spring', stiffness: 420, damping: 32 }} />}
                  <b>{option.label}</b>
                  <small>{option.hint}</small>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {thread.open && (
        <div className="ib-actions">
          <button type="button" className="ib-btn" onClick={onPropose}>
            <Icon name="calendar" size={18} />
            Proponer fechas
          </button>
          <button type="button" className="ib-btn ghost" onClick={v.finish} disabled={v.finishing}>
            Cerrar conversación
          </button>
        </div>
      )}
    </section>
  );
}
