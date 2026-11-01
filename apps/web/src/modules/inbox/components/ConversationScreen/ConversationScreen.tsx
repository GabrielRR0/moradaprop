'use client';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { Icon } from '@/components/icons';
import { STATUS_LABEL, STATUS_TONE, formatSlot } from '@/lib/appointments';
import { MotionSupport } from '@/support/motion';
import { useConversation } from '../../hooks/useConversation';
import { useProposal } from '../../hooks/useProposal';
import { useTemplates } from '../../hooks/useTemplates';
import { RefreshButton, Shell } from '../shared/Shell';
import { TemplateForm } from '../templates/TemplateForm';
import { TemplatePicker } from '../templates/TemplatePicker';
import { Composer } from './Composer';
import { ManagerPanel } from './ManagerPanel';
import { MessageList } from './MessageList';
import { ProposeSheet } from './ProposeSheet';

/** Una conversación entre el cliente y quien gestiona la propiedad. Sin tiempo real: "Recargar" trae lo nuevo. */
export function ConversationScreen({ id }: { id: string }) {
  const v = useConversation(id);
  const proposal = useProposal();
  const [proposing, setProposing] = useState(false);
  const [picking, setPicking] = useState(false);
  // Al guardar lo que se estaba escribiendo, el formulario se abre con ese texto.
  const [saving, setSaving] = useState<string | null>(null);
  const templates = useTemplates(v.thread?.viewer === 'manager');
  const end = useRef<HTMLDivElement>(null);
  const count = v.thread?.messages.length ?? 0;

  // Al abrir y cuando llega un mensaje nuevo, baja hasta el último.
  useEffect(() => {
    end.current?.scrollIntoView({ behavior: count > 1 ? 'smooth' : 'auto', block: 'end' });
  }, [count]);

  const thread = v.thread;
  const actions = <RefreshButton onClick={v.refresh} busy={v.refreshing} />;

  if (!thread) {
    return (
      <Shell title="Conversación" back="/mensajes" backLabel="Volver a mensajes" actions={actions}>
        {v.loading && <div className="ib-skel tall" aria-busy="true" />}
        {v.failed && (
          <div className="ib-empty">
            <Icon name="alert" size={30} />
            <p>No encontramos esta conversación o no tienes acceso a ella.</p>
            <Link href="/mensajes" className="ib-btn">
              Volver a mensajes
            </Link>
          </div>
        )}
      </Shell>
    );
  }

  return (
    <Shell title={thread.counterpart} subtitle={v.updated ? `Actualizado ${v.updated}` : undefined} back="/mensajes" backLabel="Volver a mensajes" actions={actions}>
      <Link href={`/propiedad/${thread.property.id}`} className="ib-prop">
        <span className="ib-thumb">{thread.property.thumb ? <img src={thread.property.thumb} alt="" /> : <Icon name="home" size={22} />}</span>
        <span className="ib-prop-text">
          <b>{thread.property.title}</b>
          <small>{thread.property.location}</small>
        </span>
        <em className={`ib-tag ${STATUS_TONE[thread.status]}`}>{STATUS_LABEL[thread.status]}</em>
      </Link>

      <MotionSupport.AnimatePresence initial={false}>
        {thread.scheduledAt && thread.status === 'CONFIRMADA' && (
          <MotionSupport.motion.div className="ib-visit" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
            <Icon name="calendar" size={20} />
            <span>
              Visita acordada: <b>{formatSlot(thread.scheduledAt)}</b>
            </span>
          </MotionSupport.motion.div>
        )}
      </MotionSupport.AnimatePresence>

      {thread.viewer === 'manager' && <ManagerPanel v={v} onPropose={() => setProposing(true)} />}

      <MessageList v={v} />
      <div ref={end} />

      <div className="ib-dock">
        <Composer
          v={v}
          templates={templates}
          fill={{ name: thread.contact?.name, property: thread.property.title }}
          onOpenPicker={() => setPicking(true)}
          onSaveDraft={() => setSaving(v.draft)}
        />
        {thread.viewer === 'client' && thread.open && (
          <button type="button" className="ib-cancel" onClick={v.finish} disabled={v.finishing}>
            Cancelar esta solicitud
          </button>
        )}
      </div>

      <TemplatePicker
        open={picking}
        onClose={() => setPicking(false)}
        templates={templates}
        data={{ name: thread.contact?.name, property: thread.property.title }}
        draft={v.draft}
        onPick={(text) => {
          v.setDraft(text);
          setPicking(false);
        }}
        onSaveDraft={() => {
          setPicking(false);
          setSaving(v.draft);
        }}
      />
      <TemplateForm open={saving !== null} onClose={() => setSaving(null)} templates={templates} initialBody={saving ?? ''} />

      <ProposeSheet
        open={proposing}
        onClose={() => setProposing(false)}
        proposal={proposal}
        busy={v.proposing}
        onSend={() =>
          v.propose(
            proposal.picked.map((slot) => slot.iso),
            proposal.note.trim(),
            () => {
              setProposing(false);
              proposal.reset();
            },
          )
        }
      />
    </Shell>
  );
}
