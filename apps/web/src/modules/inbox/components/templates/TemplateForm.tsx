'use client';
import { useState } from 'react';
import { Icon } from '@/components/icons';
import { Button, Field, Sheet } from '@/components/ui';
import { VARIABLES, type ReplyTemplate } from '@/lib/reply-templates';
import type { TemplatesView } from '../../hooks/useTemplates';

const MAX_BODY = 1000;

/** Los campos del formulario; vive aparte para que su estado empiece de cero cada vez que se abre la ventana. */
function Fields({ templates, editing, initialBody, onClose }: { templates: TemplatesView; editing: ReplyTemplate | null; initialBody: string; onClose: () => void }) {
  const [title, setTitle] = useState(editing?.title ?? '');
  const [body, setBody] = useState(editing?.body ?? initialBody);
  const [shared, setShared] = useState(editing?.shared ?? false);
  const [confirming, setConfirming] = useState(false);
  const ready = title.trim().length > 0 && body.trim().length > 0;

  return (
    <div className="ib-form">
      <Field label="Título" value={title} onChange={setTitle} placeholder="Ej.: Sigue disponible" maxLength={80} hint="Solo para que la encuentres rápido." />

      <label className="ib-note">
        <span>Texto</span>
        <textarea value={body} maxLength={MAX_BODY} rows={6} placeholder="Escribe el mensaje que quieres reutilizar" onChange={(event) => setBody(event.target.value)} />
        <small className="ib-help">{`${body.length}/${MAX_BODY}`}</small>
      </label>

      <div className="ib-vars" aria-label="Insertar datos">
        <small className="ib-help">Se completa solo al usarla:</small>
        {VARIABLES.map((variable) => (
          <button key={variable.token} type="button" className="ib-chip" title={variable.label} onClick={() => setBody((current) => `${current}${current && !current.endsWith(' ') ? ' ' : ''}${variable.token}`.slice(0, MAX_BODY))}>
            {variable.token}
          </button>
        ))}
      </div>

      {templates.canShare && (
        <label className={shared ? 'ib-switch on' : 'ib-switch'}>
          <input type="checkbox" checked={shared} onChange={(event) => setShared(event.target.checked)} />
          <span className="ib-switch-track" aria-hidden="true">
            <i />
          </span>
          <span className="ib-switch-text">
            <b>Compartir con mi inmobiliaria</b>
            <small>{shared ? 'Todo tu equipo podrá usarla.' : 'Solo tú puedes verla y usarla.'}</small>
          </span>
        </label>
      )}

      <p className="ib-lock">
        <Icon name="lock" size={14} />
        Se guarda cifrada: ni el título ni el texto se leen en la base de datos.
      </p>

      <Button block disabled={!ready} loading={templates.saving} onClick={() => templates.save(editing?.id, { title: title.trim(), body: body.trim(), shared }, onClose)}>
        <Icon name="check" size={18} />
        {editing ? 'Guardar cambios' : 'Guardar respuesta'}
      </Button>

      {editing && (
        <Button
          block
          variant="secondary"
          loading={templates.removing}
          onClick={() => (confirming ? templates.remove(editing.id, onClose) : setConfirming(true))}
        >
          {confirming ? '¿Seguro? Toca otra vez para borrarla' : 'Borrar respuesta'}
        </Button>
      )}
    </div>
  );
}

/** Ventana para crear o editar un texto reutilizable. `initialBody` precarga el texto (ej. lo que se estaba escribiendo). */
export function TemplateForm({
  open,
  onClose,
  templates,
  editing = null,
  initialBody = '',
}: {
  open: boolean;
  onClose: () => void;
  templates: TemplatesView;
  editing?: ReplyTemplate | null;
  initialBody?: string;
}) {
  return (
    <Sheet open={open} onClose={onClose} title={editing ? 'Editar respuesta' : 'Nueva respuesta'}>
      <Fields templates={templates} editing={editing} initialBody={initialBody} onClose={onClose} />
    </Sheet>
  );
}
