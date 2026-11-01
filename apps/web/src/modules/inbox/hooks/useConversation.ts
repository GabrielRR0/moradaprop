import { useState } from 'react';
import { appointmentService, availabilityOf, dayLabel, timeAgo, type PropertyAvailability, type Thread } from '@/lib/appointments';
import { propertyService } from '@/lib/properties';
import { toast } from '@/lib/toast';
import { describeError } from '@/modules/auth';
import { QuerySupport } from '@/support/query';

/** Mensajes juntos por día, con su encabezado ("Hoy", "Ayer", "5 de noviembre"). */
function groupByDay(messages: Thread['messages']) {
  const groups: Array<{ label: string; messages: Thread['messages'] }> = [];
  for (const message of messages) {
    const label = dayLabel(message.createdAt);
    const last = groups[groups.length - 1];
    if (last?.label === label) last.messages.push(message);
    else groups.push({ label, messages: [message] });
  }
  return groups;
}

/**
 * Una conversación, para el cliente y para quien gestiona la propiedad.
 * No es en tiempo real: se carga al abrir y se vuelve a pedir con `refresh` ("Recargar").
 */
export function useConversation(id: string) {
  const client = QuerySupport.useQueryClient();
  const key = ['appointments', 'thread', id];
  const [draft, setDraft] = useState('');

  const query = QuerySupport.useQuery({ queryKey: key, queryFn: () => appointmentService.thread(id), refetchOnWindowFocus: false });
  const thread = query.data ?? null;
  const manager = thread?.viewer === 'manager';

  // Quien gestiona puede invitar al cliente a WhatsApp: el número viene en la ficha de la propiedad.
  const property = QuerySupport.useQuery({
    // Misma clave que la ficha con sesion (aqui siempre la hay): comparten la respuesta.
    queryKey: ['property', thread?.property.id, true],
    enabled: manager,
    queryFn: ({ signal }) => propertyService.detail(thread!.property.id, signal),
    staleTime: 60_000,
  });

  /** Guarda la conversación que devolvió el servidor y avisa a la bandeja que cambió. */
  const apply = (next: Thread) => {
    client.setQueryData(key, next);
    void client.invalidateQueries({ queryKey: ['appointments', 'mine'] });
    void client.invalidateQueries({ queryKey: ['appointments', 'received'] });
  };
  const fail = (error: unknown) => toast(describeError(error, 'No pudimos completar eso. Inténtalo otra vez.').text, 'warn');

  const send = QuerySupport.useMutation({
    mutationFn: (body: string) => appointmentService.send(id, body),
    onSuccess: (next) => {
      setDraft('');
      apply(next);
    },
    onError: fail,
  });
  const edit = QuerySupport.useMutation({
    mutationFn: (input: { messageId: string; body: string }) => appointmentService.editMessage(id, input.messageId, input.body),
    onSuccess: apply,
    onError: (error) => {
      fail(error);
      // Si se acabo el tiempo, la conversacion vuelve a pedirse para que el mensaje deje de ofrecerse como editable.
      void query.refetch();
    },
  });
  const accept = QuerySupport.useMutation({
    mutationFn: (slotId: string) => appointmentService.accept(id, slotId),
    onSuccess: (next) => {
      apply(next);
      toast('¡Visita acordada! El anunciante ya lo sabe.');
    },
    onError: fail,
  });
  const propose = QuerySupport.useMutation({
    mutationFn: (input: { slots: string[]; note: string }) => appointmentService.propose(id, input.slots, input.note),
    onSuccess: (next) => {
      apply(next);
      toast('Fechas enviadas. El cliente elegirá una.');
    },
    onError: fail,
  });
  const finish = QuerySupport.useMutation({
    mutationFn: () => (manager ? appointmentService.close(id) : appointmentService.cancel(id)),
    onSuccess: () => {
      toast(manager ? 'Conversación cerrada' : 'Solicitud cancelada', 'info');
      void query.refetch();
      void client.invalidateQueries({ queryKey: ['appointments', 'mine'] });
      void client.invalidateQueries({ queryKey: ['appointments', 'received'] });
    },
    onError: fail,
  });
  const availability = QuerySupport.useMutation({
    mutationFn: (next: PropertyAvailability) => appointmentService.setAvailability(thread!.property.id, next),
    onSuccess: () => {
      toast('Estado de la propiedad actualizado');
      void query.refetch();
      void client.invalidateQueries({ queryKey: ['property', thread?.property.id] });
    },
    onError: fail,
  });

  const lastFromMe = thread?.messages.length ? (thread.messages[thread.messages.length - 1].fromClient === (thread.viewer === 'client')) : false;
  const managerReplied = thread?.messages.some((message) => !message.fromClient) ?? false;

  return {
    thread,
    groups: thread ? groupByDay(thread.messages) : [],
    loading: query.isLoading,
    failed: query.isError,
    refreshing: query.isFetching,
    /** "Actualizado hace 2 min" */
    updated: query.dataUpdatedAt ? timeAgo(new Date(query.dataUpdatedAt).toISOString()) : '',
    refresh: () => void query.refetch(),

    draft,
    setDraft,
    sending: send.isPending,
    submit: () => {
      const body = draft.trim();
      if (body && !send.isPending) send.mutate(body);
    },

    /** Diferencia entre el reloj del servidor y el de este dispositivo: la cuenta de los 3 minutos de edición usa la del servidor. */
    skew: thread ? Date.parse(thread.serverTime) - query.dataUpdatedAt : 0,
    /** Corrige un mensaje propio; `done` corre solo si el servidor lo aceptó. */
    edit: (messageId: string, body: string, done: () => void) => edit.mutate({ messageId, body }, { onSuccess: done }),
    editing: edit.isPending,

    /** El cliente escribió y el anunciante todavía no responde. */
    waiting: thread?.viewer === 'client' && !managerReplied && lastFromMe,
    availability: thread ? availabilityOf(thread.property) : 'free',
    changeAvailability: (next: PropertyAvailability) => availability.mutate(next),
    changingAvailability: availability.isPending,
    whatsapp: property.data?.whatsapp ?? null,

    accept: (slotId: string) => accept.mutate(slotId),
    accepting: accept.isPending,
    propose: (slots: string[], note: string, done: () => void) => propose.mutate({ slots, note }, { onSuccess: done }),
    proposing: propose.isPending,
    finish: () => finish.mutate(),
    finishing: finish.isPending,
  };
}

export type ConversationView = ReturnType<typeof useConversation>;
