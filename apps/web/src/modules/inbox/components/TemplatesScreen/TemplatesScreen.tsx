'use client';
import { useState } from 'react';
import { Icon } from '@/components/icons';
import type { ReplyTemplate } from '@/lib/reply-templates';
import { MotionSupport } from '@/support/motion';
import { searchTemplates, useTemplates } from '../../hooks/useTemplates';
import { Shell } from '../shared/Shell';
import { TemplateForm } from '../templates/TemplateForm';
import { TemplateList } from '../templates/TemplateList';

/** Administrar las respuestas guardadas: crearlas, editarlas, compartirlas con el equipo o borrarlas. */
export function TemplatesScreen() {
  const templates = useTemplates();
  const [search, setSearch] = useState('');
  const [form, setForm] = useState<{ editing: ReplyTemplate | null } | null>(null);
  const found = searchTemplates(templates.items, search);

  return (
    <Shell
      title="Respuestas guardadas"
      subtitle={templates.canShare ? 'Privadas o compartidas con tu equipo' : 'Textos que reutilizas al responder'}
      back="/mensajes"
      backLabel="Volver a mensajes"
      actions={
        <button type="button" className="ib-btn" onClick={() => setForm({ editing: null })}>
          <Icon name="plus" size={18} />
          <span className="ib-hide-sm">Nueva</span>
        </button>
      }
    >
      <p className="ib-lock">
        <Icon name="lock" size={14} />
        Todo lo que guardas aquí va cifrado. {templates.canShare ? 'Las compartidas las ve y usa todo el equipo de tu inmobiliaria.' : 'Solo tú puedes verlas.'}
      </p>

      {templates.items.length > 4 && (
        <input className="ib-search" type="search" value={search} placeholder="Buscar en mis respuestas" aria-label="Buscar" onChange={(event) => setSearch(event.target.value)} />
      )}

      {templates.loading && <div className="ib-skel tall" aria-busy="true" />}
      {templates.failed && (
        <div className="ib-empty">
          <Icon name="alert" size={30} />
          <p>No pudimos cargar tus respuestas.</p>
          <button type="button" className="ib-btn" onClick={templates.retry}>
            Reintentar
          </button>
        </div>
      )}

      {!templates.loading && !templates.failed && templates.items.length === 0 && (
        <MotionSupport.motion.div className="ib-empty" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <span className="ib-empty-ico">
            <Icon name="clipboard" size={30} />
          </span>
          <h2>Aún no tienes respuestas guardadas</h2>
          <p>Guarda los mensajes que repites (horarios, requisitos, “sigue disponible”) y úsalos con un toque al responder.</p>
          <button type="button" className="ib-btn" onClick={() => setForm({ editing: null })}>
            <Icon name="plus" size={18} />
            Crear la primera
          </button>
        </MotionSupport.motion.div>
      )}

      {templates.items.length > 0 && (
        <TemplateList
          items={found}
          empty="Ninguna coincide con tu búsqueda."
          onPick={(item) => item.canEdit && setForm({ editing: item })}
          hintFor={(item) => (item.canEdit ? 'Toca para editar' : `Solo ${item.author} o el administrador pueden editarla`)}
        />
      )}

      <TemplateForm open={form !== null} onClose={() => setForm(null)} templates={templates} editing={form?.editing ?? null} />
    </Shell>
  );
}
