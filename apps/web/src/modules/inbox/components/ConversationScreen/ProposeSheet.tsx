'use client';
import { Button, Sheet } from '@/components/ui';
import { Icon } from '@/components/icons';
import { MotionSupport } from '@/support/motion';
import { MAX_SLOTS, type ProposalView } from '../../hooks/useProposal';

/**
 * Ofrecer fechas para la visita: eliges un día, tocas las horas que te sirven (hasta 5 en total) y las envías.
 * El cliente solo tiene que aceptar una; nunca tiene que escribir una fecha.
 */
export function ProposeSheet({
  open,
  onClose,
  proposal,
  busy,
  onSend,
}: {
  open: boolean;
  onClose: () => void;
  proposal: ProposalView;
  busy: boolean;
  onSend: () => void;
}) {
  const count = proposal.picked.length;

  return (
    <Sheet open={open} onClose={onClose} title="Proponer fechas para la visita">
      <div className="ib-propose">
        <p className="ib-help">Elige un día y toca las horas en que puedes recibirlo. Puedes ofrecer hasta {MAX_SLOTS} opciones y el cliente aceptará una.</p>

        <div className="ib-days" role="listbox" aria-label="Día">
          {proposal.days.map((day) => (
            <button
              key={day.index}
              type="button"
              role="option"
              aria-selected={day.index === proposal.dayIndex}
              className={day.index === proposal.dayIndex ? 'ib-day-btn on' : 'ib-day-btn'}
              onClick={() => proposal.chooseDay(day.index)}
            >
              <small>{day.index === 0 ? 'Hoy' : day.weekday}</small>
              <b>{day.number}</b>
            </button>
          ))}
        </div>

        <div className="ib-hours" aria-label="Hora">
          {proposal.hours.map((hour) => (
            <button
              key={hour.iso}
              type="button"
              className={hour.on ? 'ib-hour on' : 'ib-hour'}
              disabled={hour.past || (!hour.on && proposal.full)}
              aria-pressed={hour.on}
              onClick={() => proposal.toggle(hour.iso)}
            >
              {hour.hour}
            </button>
          ))}
        </div>

        <div className="ib-picked" aria-live="polite">
          <MotionSupport.AnimatePresence initial={false}>
            {proposal.picked.map((slot) => (
              <MotionSupport.motion.span
                key={slot.iso}
                className="ib-picked-chip"
                layout
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
              >
                <Icon name="calendar" size={14} />
                {slot.label}
                <button type="button" onClick={() => proposal.remove(slot.iso)} aria-label={`Quitar ${slot.label}`}>
                  <Icon name="close" size={14} />
                </button>
              </MotionSupport.motion.span>
            ))}
          </MotionSupport.AnimatePresence>
          {count === 0 && <small className="ib-help">Todavía no elegiste ninguna fecha.</small>}
        </div>

        <label className="ib-note">
          <span>Mensaje (opcional)</span>
          <textarea value={proposal.note} maxLength={500} rows={2} placeholder="Ej.: Te espero en la entrada principal." onChange={(event) => proposal.setNote(event.target.value)} />
        </label>

        <Button block disabled={count === 0} loading={busy} onClick={onSend}>
          <Icon name="send" size={18} />
          {count === 0 ? 'Elige al menos una fecha' : `Enviar ${count} ${count === 1 ? 'fecha' : 'fechas'}`}
        </Button>
      </div>
    </Sheet>
  );
}
