import { useState } from 'react';
import { appointmentService } from '@/lib/appointments';
import { askLogin } from '@/lib/login-prompt';
import { describeError, useSession } from '@/modules/auth';
import { QuerySupport } from '@/support/query';
import type { ContactKind } from './contact-options';
import type { PropertyInfo } from './usePropertyBooking';

/** Mensaje que se envía si el cliente no escribe nada (solo en interés, visita y apartado). */
const DEFAULT_TEXT: Record<ContactKind, string> = {
  INTERES: 'Hola, me interesa esta propiedad.',
  PREGUNTA: '',
  VISITA: 'Hola, quisiera visitar esta propiedad.',
  RESERVA: 'Hola, quisiera apartar esta propiedad.',
};

const OPEN_STATUSES = ['PENDIENTE', 'ABIERTA', 'CONFIRMADA'];

/**
 * Escribirle al anunciante desde la ficha, compartido por escritorio y teléfono.
 * Sin sesión, cualquier botón pide ingresar. Si ya hay una conversación abierta con esta propiedad,
 * en vez de los botones se ofrece abrirla (así no se duplican solicitudes).
 */
export function usePropertyContact(property: PropertyInfo) {
  const { status } = useSession();
  const authed = status === 'authed';
  const client = QuerySupport.useQueryClient();
  const [kind, setKind] = useState<ContactKind | null>(null);
  const [text, setText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [sentId, setSentId] = useState<string | null>(null);

  const mine = QuerySupport.useQuery({
    queryKey: ['appointments', 'mine', property.id],
    enabled: authed && !property.canManage,
    queryFn: () => appointmentService.mine(property.id),
    staleTime: 30_000,
  });
  const conversation = mine.data?.items.find((item) => OPEN_STATUSES.includes(item.status)) ?? null;

  const send = QuerySupport.useMutation({
    mutationFn: (message: string) => appointmentService.create({ propertyId: property.id, type: kind!, message: message || undefined }),
    onSuccess: (created) => {
      setSentId(created.id);
      void client.invalidateQueries({ queryKey: ['appointments'] });
    },
    onError: (failure) => setError(describeError(failure, 'No pudimos enviar tu mensaje. Inténtalo otra vez.').text),
  });

  /** Qué se puede hacer con esta propiedad ahora mismo. */
  const mode = property.canManage
    ? 'own'
    : property.rawStatus === 'ALQUILADA' || property.rawStatus === 'PAUSADA'
      ? 'unavailable'
      : !property.acceptsVisits
        ? 'closed'
        : 'open';

  function start(next: ContactKind) {
    if (!authed) {
      askLogin('escribirle al anunciante');
      return;
    }
    setKind(next);
    setText('');
    setError(null);
    setSentId(null);
  }

  function submit() {
    if (!kind) return;
    const message = text.trim() || DEFAULT_TEXT[kind];
    if (!message) {
      setError('Escribe tu pregunta para poder enviarla.');
      return;
    }
    setError(null);
    send.mutate(message);
  }

  return {
    authed,
    mode,
    /** La conversación abierta con esta propiedad, si ya existe. */
    conversation,
    kind,
    setKind: (next: ContactKind) => {
      setKind(next);
      setError(null);
    },
    text,
    setText,
    error,
    sentId,
    sending: send.isPending,
    start,
    submit,
    close: () => setKind(null),
    /** Sin sesión el botón de WhatsApp pide ingresar (el número solo se entrega a quien tiene cuenta). */
    askLoginForWhatsapp: () => askLogin('ver el WhatsApp del anunciante'),
  };
}

export type PropertyContactView = ReturnType<typeof usePropertyContact>;
