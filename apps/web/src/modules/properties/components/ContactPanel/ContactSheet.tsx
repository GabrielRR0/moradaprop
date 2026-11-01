'use client';
import Link from 'next/link';
import { useRef } from 'react';
import { Button, Notice, Sheet, SuccessBurst } from '@/components/ui';
import { STARTERS } from '@/lib/appointments';
import { MotionSupport } from '@/support/motion';
import { CONTACT_OPTIONS, RESERVE_HELP, type ContactKind } from '../../hooks/contact-options';
import type { PropertyInfo } from '../../hooks/usePropertyBooking';
import type { PropertyContactView } from '../../hooks/usePropertyContact';
import { Icon } from '@/components/icons';

const MAX = 1000;

/** La ventana para escribirle al anunciante: eliges qué quieres, escribes y envías. Al terminar ofrece abrir la conversación. */
export function ContactSheet({ contact, property }: { contact: PropertyContactView; property: PropertyInfo }) {
  // Se recuerda el último tipo para que el contenido no cambie mientras la ventana se cierra.
  const last = useRef<ContactKind>('INTERES');
  if (contact.kind) last.current = contact.kind;
  const kind = contact.kind ?? last.current;
  const reserve = kind === 'RESERVA';
  const option = CONTACT_OPTIONS.find((item) => item.kind === kind) ?? CONTACT_OPTIONS[0];
  const title = contact.sentId ? 'Mensaje enviado' : reserve ? 'Apartar esta propiedad' : 'Escríbele al anunciante';

  return (
    <Sheet open={contact.kind !== null} onClose={contact.close} title={title}>
      <div className="pc-sheet">
        <div className="pc-prop">
          {property.photos[0] ? <img src={property.photos[0]} alt="" /> : <span className="pc-prop-ph"><Icon name="home" size={22} /></span>}
          <span>
            <b>{property.title}</b>
            <small>{property.place}</small>
          </span>
        </div>

        {contact.sentId ? (
          <MotionSupport.motion.div className="pc-sent" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <SuccessBurst />
            <h3>¡Listo, ya le llegó tu mensaje!</h3>
            <p>
              Normalmente el anunciante tarda un poco en responder. Te avisaremos por correo y podrás ver su respuesta en{' '}
              <b>Mensajes</b>.
            </p>
            <Link href={`/mensajes/${contact.sentId}`} className="ui-btn block">
              Ver la conversación
            </Link>
            <Button block variant="secondary" onClick={contact.close}>
              Seguir viendo la propiedad
            </Button>
          </MotionSupport.motion.div>
        ) : (
          <>
            {!reserve && (
              <div className="pc-kinds" role="tablist" aria-label="¿Qué quieres hacer?">
                {CONTACT_OPTIONS.map((item) => {
                  const on = item.kind === kind;
                  return (
                    <button
                      key={item.kind}
                      type="button"
                      role="tab"
                      aria-selected={on}
                      className={on ? 'pc-kind on' : 'pc-kind'}
                      onClick={() => contact.setKind(item.kind)}
                    >
                      {on && <MotionSupport.motion.span layoutId="pc-kind-pill" className="pc-kind-pill" transition={{ type: 'spring', stiffness: 420, damping: 32 }} />}
                      <Icon name={item.icon} size={18} />
                      <span>{item.title}</span>
                    </button>
                  );
                })}
              </div>
            )}

            <MotionSupport.motion.p key={kind} className="pc-help" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}>
              {reserve ? RESERVE_HELP : option.help}
            </MotionSupport.motion.p>

            <label className="pc-field">
              <span className="pc-label">Tu mensaje</span>
              <textarea
                className="pc-text"
                value={contact.text}
                maxLength={MAX}
                placeholder={reserve ? 'Cuéntale algo más (opcional)' : option.placeholder}
                onChange={(event) => contact.setText(event.target.value)}
                rows={5}
              />
              <span className="pc-count">{`${contact.text.length}/${MAX}`}</span>
            </label>

            {!reserve && (
              <div className="pc-starters" aria-label="Mensajes rápidos">
                {STARTERS[kind as keyof typeof STARTERS].map((text) => (
                  <button key={text} type="button" className="pc-starter" onClick={() => contact.setText(text)}>
                    {text}
                  </button>
                ))}
              </div>
            )}

            <Notice tone="error" show={!!contact.error}>
              {contact.error}
            </Notice>
            <Button block loading={contact.sending} onClick={contact.submit}>
              <Icon name="send" size={18} />
              Enviar mensaje
            </Button>
            <p className="pc-fine">Tu correo y teléfono no se muestran: hablan por aquí y te avisamos por correo.</p>
          </>
        )}
      </div>
    </Sheet>
  );
}
