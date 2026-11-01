'use client';
import { useEffect, useRef } from 'react';
import { Icon } from '@/components/icons';
import { fillTemplate, type FillData } from '@/lib/reply-templates';
import type { ConversationView } from '../../hooks/useConversation';
import type { TemplatesView } from '../../hooks/useTemplates';

const MAX = 1000;
/** Cuántas respuestas guardadas se ofrecen como atajo sobre el cuadro de texto. */
const SHORTCUTS = 3;

/** Atajos por defecto de quien gestiona mientras no tenga respuestas guardadas. */
const STARTER_REPLIES = ['Hola, con gusto. Cuéntame qué necesitas saber.', 'Sigue disponible. ¿Te gustaría coordinar una visita?'];

/**
 * Cuadro para escribir. Enter envía y Shift+Enter hace un salto de línea. Quien gestiona la propiedad ve atajos
 * con sus respuestas guardadas, el botón "Mis respuestas" y, si ya escribió algo, "Guardar como respuesta".
 */
export function Composer({
  v,
  templates,
  fill,
  onOpenPicker,
  onSaveDraft,
}: {
  v: ConversationView;
  templates: TemplatesView;
  fill: FillData;
  onOpenPicker: () => void;
  onSaveDraft: () => void;
}) {
  const box = useRef<HTMLTextAreaElement>(null);
  const thread = v.thread!;
  // Al enviar el cuadro se vacia: vuelve a su tamano normal.
  useEffect(() => {
    if (!v.draft && box.current) box.current.style.height = 'auto';
  }, [v.draft]);

  if (!thread.open) {
    return <p className="ib-closed">Esta conversación está cerrada, así que ya no se puede escribir en ella.</p>;
  }
  const manager = thread.viewer === 'manager';

  // Atajos: primero las respuestas guardadas (las mas recientes) y, si no hay, un par de ejemplos.
  const chips: Array<{ key: string; label: string; text: string }> = templates.items
    .slice(0, SHORTCUTS)
    .map((item) => ({ key: item.id, label: item.title, text: fillTemplate(item.body, fill) }));
  if (manager && chips.length === 0) STARTER_REPLIES.forEach((text) => chips.push({ key: text, label: text, text }));
  if (manager && v.whatsapp) {
    chips.push({ key: 'wa', label: 'Invitar a WhatsApp', text: `Para coordinar más rápido, escríbeme por WhatsApp: https://wa.me/${v.whatsapp.replace(/\D/g, '')}` });
  }

  return (
    <form
      className="ib-composer"
      onSubmit={(event) => {
        event.preventDefault();
        v.submit();
      }}
    >
      {manager && (
        <div className="ib-chips">
          <button type="button" className="ib-chip strong" onClick={onOpenPicker}>
            <Icon name="clipboard" size={14} />
            Mis respuestas
          </button>
          {!v.draft && chips.map((chip) => (
            <button key={chip.key} type="button" className="ib-chip" onClick={() => v.setDraft(chip.text)}>
              {chip.label}
            </button>
          ))}
          {v.draft.trim() && (
            <button type="button" className="ib-chip" onClick={onSaveDraft}>
              <Icon name="plus" size={14} />
              Guardar como respuesta
            </button>
          )}
        </div>
      )}
      <div className="ib-compose-row">
        <textarea
          ref={box}
          value={v.draft}
          maxLength={MAX}
          rows={1}
          placeholder="Escribe un mensaje…"
          aria-label="Escribe un mensaje"
          onChange={(event) => {
            v.setDraft(event.target.value);
            // Crece con lo escrito hasta un tope.
            event.target.style.height = 'auto';
            event.target.style.height = `${Math.min(event.target.scrollHeight, 140)}px`;
          }}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && !event.shiftKey) {
              event.preventDefault();
              v.submit();
            }
          }}
        />
        <button type="submit" className="ib-send" disabled={!v.draft.trim() || v.sending} aria-label="Enviar">
          {v.sending ? <span className="ib-spin" /> : <Icon name="send" size={20} />}
        </button>
      </div>
    </form>
  );
}
