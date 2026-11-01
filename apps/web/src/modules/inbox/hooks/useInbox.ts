import { useState } from 'react';
import {
  STATUS_LABEL,
  STATUS_TONE,
  TYPE_LABEL,
  appointmentService,
  formatSlot,
  previewOf,
  timeAgo,
  type AppointmentSummary,
} from '@/lib/appointments';
import { useSession } from '@/modules/auth';
import { QuerySupport } from '@/support/query';

export type InboxTab = 'sent' | 'received';

/** Una fila de la bandeja, ya con los textos listos para dibujar. */
function toRow(item: AppointmentSummary, tab: InboxTab) {
  const last = item.lastMessage;
  // "Tú:" cuando el último mensaje lo escribió esta misma persona.
  const mine = last ? (tab === 'sent') === last.fromClient : false;
  return {
    id: item.id,
    href: `/mensajes/${item.id}`,
    title: item.property.title,
    place: item.property.location,
    thumb: item.property.thumb,
    // En "Enviados" se habla con el anunciante; en "Recibidos", con el interesado.
    who: tab === 'received' ? (item.contact?.name ?? 'Interesado') : 'Anunciante',
    type: TYPE_LABEL[item.type],
    status: STATUS_LABEL[item.status],
    tone: STATUS_TONE[item.status],
    preview: last ? `${mine ? 'Tú: ' : ''}${previewOf(last.kind, last.body)}` : 'Sin mensajes todavía',
    ago: last ? timeAgo(last.at) : '',
    unread: item.unread,
    visit: item.scheduledAt ? formatSlot(item.scheduledAt) : null,
  };
}

/**
 * La bandeja de mensajes. Quien publica propiedades ve dos pestañas ("Recibidos" de los interesados y
 * "Enviados" de lo que él mismo pidió); el resto solo "Enviados". No es en tiempo real: se actualiza al abrir o con "Recargar".
 */
export function useInbox() {
  const { user } = useSession();
  const publishes = user?.roles.some((role) => role === 'OWNER' || role === 'AGENCY' || role === 'ADMIN') ?? false;
  const [chosen, setChosen] = useState<InboxTab | null>(null);
  const tab: InboxTab = chosen ?? (publishes ? 'received' : 'sent');

  const sent = QuerySupport.useQuery({ queryKey: ['appointments', 'mine'], queryFn: () => appointmentService.mine() });
  const received = QuerySupport.useQuery({
    queryKey: ['appointments', 'received'],
    enabled: publishes,
    queryFn: () => appointmentService.received(),
  });
  const active = tab === 'received' ? received : sent;
  const unread = (query: typeof sent) => (query.data?.items ?? []).filter((item) => item.unread).length;

  return {
    publishes,
    tab,
    setTab: setChosen,
    rows: (active.data?.items ?? []).map((item) => toRow(item, tab)),
    unreadSent: unread(sent),
    unreadReceived: unread(received),
    loading: active.isLoading,
    failed: active.isError,
    refreshing: active.isFetching,
    refresh: () => void active.refetch(),
  };
}

export type InboxView = ReturnType<typeof useInbox>;
