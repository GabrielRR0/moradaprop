'use client';
import Link from 'next/link';
import { Icon } from '@/components/icons';
import { brand } from '@/config';
import { STATUS_LABEL } from '@/lib/appointments';
import { whatsappUrl } from '@/lib/whatsapp';
import { MotionSupport } from '@/support/motion';
import { CONTACT_OPTIONS } from '../../hooks/contact-options';
import { usePropertyContact } from '../../hooks/usePropertyContact';
import type { PropertyInfo } from '../../hooks/usePropertyBooking';
import './contactpanel.css';
import { ContactSheet } from './ContactSheet';

/** Aviso fijo cuando no se puede escribir (es la propiedad del usuario, ya no está disponible o está reservada del todo). */
function Note({ icon, children }: { icon: 'shield' | 'ban' | 'clock'; children: React.ReactNode }) {
  return (
    <MotionSupport.motion.p className="pc-note" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
      <Icon name={icon} size={18} />
      <span>{children}</span>
    </MotionSupport.motion.p>
  );
}

/**
 * Todo lo que el cliente puede hacer para hablar con el anunciante: los tres botones (interesado, pregunta, visita),
 * WhatsApp directo y apartar. Nunca pide una fecha: si quiere ver la propiedad, el anunciante propone fechas.
 */
export function ContactPanel({ property }: { property: PropertyInfo }) {
  const contact = usePropertyContact(property);
  const talking = contact.conversation;
  const whatsapp = contact.authed ? property.whatsapp : null;

  return (
    <div className="pc">
      {property.hasScheduledVisit && (
        <MotionSupport.motion.span
          className="pc-visit"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        >
          <span className="pc-pulse" aria-hidden="true" />
          Ya tiene una visita programada
        </MotionSupport.motion.span>
      )}

      {contact.mode === 'own' && (
        <Note icon="shield">
          Esta es tu propiedad. Los mensajes de los interesados llegan a <Link href="/mensajes">Mensajes</Link>.
        </Note>
      )}
      {contact.mode === 'unavailable' && <Note icon="ban">Esta propiedad ya no está disponible.</Note>}
      {contact.mode === 'closed' && (
        <Note icon="clock">Está reservada y el anunciante ya no recibe nuevas consultas. Guárdala en favoritos por si se libera.</Note>
      )}

      {contact.mode === 'open' && talking && (
        <MotionSupport.motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          <Link href={`/mensajes/${talking.id}`} className="pc-talk">
            <span className="pc-talk-ico">
              <Icon name="message" size={22} />
              {talking.unread && <span className="pc-dot" aria-label="Mensaje nuevo" />}
            </span>
            <span className="pc-talk-text">
              <b>Ya estás hablando con el anunciante</b>
              <small>{talking.unread ? 'Tienes un mensaje nuevo' : STATUS_LABEL[talking.status]}</small>
            </span>
            <Icon name="chevron-left" size={18} style={{ transform: 'rotate(180deg)' }} />
          </Link>
        </MotionSupport.motion.div>
      )}

      {contact.mode === 'open' && !talking && (
        <div className="pc-options">
          {CONTACT_OPTIONS.map((option, index) => (
            <MotionSupport.motion.button
              key={option.kind}
              type="button"
              className="pc-option"
              onClick={() => contact.start(option.kind)}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.07, type: 'spring', stiffness: 320, damping: 26 }}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.98 }}
            >
              <span className="pc-option-ico">
                <Icon name={option.icon} size={22} />
              </span>
              <span className="pc-option-text">
                <b>{option.title}</b>
                <small>{option.hint}</small>
              </span>
              <Icon name="arrow-right" size={18} />
            </MotionSupport.motion.button>
          ))}
        </div>
      )}

      {contact.mode === 'open' &&
        (whatsapp ? (
          <a
            href={whatsappUrl(`Hola, vi "${property.title}" en ${brand.name} y me interesa.`, whatsapp)}
            target="_blank"
            rel="noreferrer"
            className="pc-whatsapp"
          >
            <Icon name="whatsapp" size={20} />
            Escribir por WhatsApp
          </a>
        ) : (
          !contact.authed && (
            <button type="button" className="pc-whatsapp" onClick={contact.askLoginForWhatsapp}>
              <Icon name="whatsapp" size={20} />
              Escribir por WhatsApp
            </button>
          )
        ))}

      {contact.mode === 'open' && property.rawStatus === 'PUBLICADA' && (
        <>
          <button type="button" className="pc-reserve" onClick={() => contact.start('RESERVA')}>
            Apartar esta propiedad
          </button>
          <span className="pc-fine">Apartar no te compromete: el anunciante confirma contigo antes de reservarla.</span>
        </>
      )}

      <ContactSheet contact={contact} property={property} />
    </div>
  );
}
