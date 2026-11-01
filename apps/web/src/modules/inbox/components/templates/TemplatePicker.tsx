'use client';
import { useState } from 'react';
import { Icon } from '@/components/icons';
import { Button, Sheet } from '@/components/ui';
import { fillTemplate, type FillData } from '@/lib/reply-templates';
import { searchTemplates, type TemplatesView } from '../../hooks/useTemplates';
import { TemplateList } from './TemplateList';

/** Contenido del selector; aparte para que la búsqueda empiece vacía cada vez que se abre. */
function Body({ templates, data, draft, onPick, onSaveDraft }: { templates: TemplatesView; data: FillData; draft: string; onPick: (text: string) => void; onSaveDraft: () => void }) {
  const [search, setSearch] = useState('');
  const found = searchTemplates(templates.items, search);

  return (
    <div className="ib-propose">
      <p className="ib-help">Toca una para escribirla en el cuadro (podrás cambiarla antes de enviar). {'{nombre}'} y {'{propiedad}'} se completan solos.</p>
      {templates.items.length > 4 && (
        <input className="ib-search" type="search" value={search} placeholder="Buscar en mis respuestas" aria-label="Buscar" onChange={(event) => setSearch(event.target.value)} />
      )}
      {templates.loading ? (
        <div className="ib-skel" aria-busy="true" />
      ) : (
        <TemplateList
          items={found}
          onPick={(item) => onPick(fillTemplate(item.body, data))}
          empty={templates.items.length ? 'Ninguna coincide con tu búsqueda.' : 'Todavía no tienes respuestas guardadas. Escribe un mensaje y guárdalo para reutilizarlo.'}
        />
      )}
      {draft.trim() && (
        <Button block variant="secondary" onClick={onSaveDraft}>
          <Icon name="plus" size={18} />
          Guardar lo que escribí como respuesta
        </Button>
      )}
    </div>
  );
}

/** Ventana con las respuestas guardadas: elegir una para usarla, o guardar lo que se está escribiendo. */
export function TemplatePicker({
  open,
  onClose,
  templates,
  data,
  draft,
  onPick,
  onSaveDraft,
}: {
  open: boolean;
  onClose: () => void;
  templates: TemplatesView;
  data: FillData;
  draft: string;
  onPick: (text: string) => void;
  onSaveDraft: () => void;
}) {
  return (
    <Sheet open={open} onClose={onClose} title="Mis respuestas">
      <Body templates={templates} data={data} draft={draft} onPick={onPick} onSaveDraft={onSaveDraft} />
    </Sheet>
  );
}
