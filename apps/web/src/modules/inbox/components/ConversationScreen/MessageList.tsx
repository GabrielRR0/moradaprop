'use client';
import { useEffect, useState } from 'react';
import { Icon } from '@/components/icons';
import { formatCountdown, formatSlot, formatTime, type Slot, type ThreadMessage } from '@/lib/appointments';
import { MotionSupport } from '@/support/motion';
import type { ConversationView } from '../../hooks/useConversation';
import { useEditWindow } from '../../hooks/useEditWindow';

const MAX = 1000;

/** Qué se muestra en una fecha propuesta, según su estado y quién mira. */
function SlotRow({ slot, canAccept, busy, onAccept }: { slot: Slot; canAccept: boolean; busy: boolean; onAccept: () => void }) {
  const passed = new Date(slot.startsAt).getTime() <= Date.now();
  return (
    <li className={`ib-slot ${slot.status.toLowerCase()}`}>
      <Icon name="calendar" size={16} />
      <span>{formatSlot(slot.startsAt)}</span>
      {slot.status === 'ACEPTADA' && (
        <em className="ib-slot-state ok">
          <Icon name="check" size={13} strokeWidth={3} /> Elegida
        </em>
      )}
      {slot.status === 'DESCARTADA' && <em className="ib-slot-state">No disponible</em>}
      {slot.status === 'PROPUESTA' && passed && <em className="ib-slot-state">Ya pasó</em>}
      {slot.status === 'PROPUESTA' && !passed && canAccept && (
        <button type="button" className="ib-accept" onClick={onAccept} disabled={busy}>
          Aceptar
        </button>
      )}
      {slot.status === 'PROPUESTA' && !passed && !canAccept && <em className="ib-slot-state wait">Por elegir</em>}
    </li>
  );
}

function Bubble({ message, mine, v, index }: { message: ThreadMessage; mine: boolean; v: ConversationView; index: number }) {
  const thread = v.thread!;
  const delay = Math.min(index, 10) * 0.03;

  // Un mensaje propio se puede corregir hasta 3 minutos despues de enviarlo. El servidor dice hasta cuando
  // (`editableUntil`) y tambien lo vuelve a comprobar al guardar; aqui solo se muestra la cuenta regresiva.
  const left = useEditWindow(mine ? message.editableUntil : null, v.skew);
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(message.body);
  const canEdit = left > 0;
  const clean = text.trim();

  // Si se acaba el tiempo con el editor abierto, se cierra solo (el texto original queda como estaba).
  useEffect(() => {
    if (editing && left <= 0) setEditing(false);
  }, [editing, left]);

  if (message.kind === 'ACUERDO') {
    return (
      <MotionSupport.motion.div className="ib-agree" initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay, type: 'spring', stiffness: 260, damping: 20 }}>
        <span className="ib-agree-ico">
          <Icon name="check" size={18} strokeWidth={3} />
        </span>
        <span>
          Visita acordada para <b>{formatSlot(message.body)}</b>
        </span>
      </MotionSupport.motion.div>
    );
  }

  return (
    <MotionSupport.motion.div className={mine ? 'ib-row mine' : 'ib-row theirs'} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }}>
      <div className={editing ? 'ib-bubble editing' : 'ib-bubble'}>
        {editing ? (
          <div className="ib-edit">
            <textarea value={text} maxLength={MAX} rows={3} autoFocus aria-label="Editar mensaje" onChange={(event) => setText(event.target.value)} />
            <div className="ib-edit-bar">
              <small>{`Te quedan ${formatCountdown(left)}`}</small>
              <button type="button" className="ib-edit-btn" onClick={() => setEditing(false)}>
                Cancelar
              </button>
              <button
                type="button"
                className="ib-edit-btn strong"
                disabled={!clean || clean === message.body || v.editing}
                onClick={() => left > 0 && v.edit(message.id, clean, () => setEditing(false))}
              >
                Guardar
              </button>
            </div>
          </div>
        ) : (
          message.body && <p>{message.body}</p>
        )}
        {message.kind === 'PROPUESTA' && (
          <ul className="ib-slots">
            {message.slots.map((slot) => (
              <SlotRow key={slot.id} slot={slot} canAccept={thread.viewer === 'client' && thread.open} busy={v.accepting} onAccept={() => v.accept(slot.id)} />
            ))}
          </ul>
        )}
        <span className="ib-meta">
          {canEdit && !editing && (
            <button
              type="button"
              className="ib-edit-link"
              onClick={() => {
                setText(message.body);
                setEditing(true);
              }}
            >
              <Icon name="pencil" size={12} />
              {`Editar · ${formatCountdown(left)}`}
            </button>
          )}
          <time>{`${message.editedAt ? 'editado · ' : ''}${formatTime(message.createdAt)}`}</time>
        </span>
      </div>
    </MotionSupport.motion.div>
  );
}

/** Los mensajes agrupados por día. Si el cliente escribió y aún no le responden, un aviso lo tranquiliza. */
export function MessageList({ v }: { v: ConversationView }) {
  const mineIsClient = v.thread!.viewer === 'client';
  let index = 0;

  return (
    <div className="ib-msgs" aria-live="polite">
      {v.groups.map((group) => (
        <section key={group.label}>
          <div className="ib-day">
            <span>{group.label}</span>
          </div>
          {group.messages.map((message) => (
            <Bubble key={message.id} message={message} mine={message.fromClient === mineIsClient} v={v} index={index++} />
          ))}
        </section>
      ))}
      {v.waiting && (
        <MotionSupport.motion.div className="ib-wait" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <span className="ib-wait-ico">
            <Icon name="clock" size={20} />
          </span>
          <span>
            <b>Esperando la respuesta del anunciante</b>
            <small>Suelen tardar un poco. Te avisaremos por correo cuando responda; también puedes tocar “Recargar”.</small>
          </span>
        </MotionSupport.motion.div>
      )}
    </div>
  );
}
