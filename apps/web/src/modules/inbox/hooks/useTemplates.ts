import { replyTemplateService, type ReplyTemplate, type ReplyTemplateInput } from '@/lib/reply-templates';
import { toast } from '@/lib/toast';
import { describeError } from '@/modules/auth';
import { QuerySupport } from '@/support/query';

const KEY = ['reply-templates'];

/** Los textos que coinciden con lo buscado (el título y el texto se descifran en el servidor, así que se filtra aquí). */
export function searchTemplates(items: ReplyTemplate[], text: string): ReplyTemplate[] {
  const needle = text.trim().toLowerCase();
  return needle ? items.filter((item) => `${item.title} ${item.body}`.toLowerCase().includes(needle)) : items;
}

/**
 * Los textos reutilizables de quien responde: los privados y los de su equipo. Compartido por el selector
 * de la conversación y la pantalla donde se administran. Guardar y borrar refrescan la lista solos.
 */
export function useTemplates(enabled = true) {
  const client = QuerySupport.useQueryClient();
  const query = QuerySupport.useQuery({ queryKey: KEY, enabled, queryFn: () => replyTemplateService.list(), staleTime: 60_000 });
  const fail = (error: unknown) => toast(describeError(error, 'No pudimos completar eso. Inténtalo otra vez.').text, 'warn');
  const refresh = () => void client.invalidateQueries({ queryKey: KEY });

  const save = QuerySupport.useMutation({
    mutationFn: (input: { id?: string; values: ReplyTemplateInput }) =>
      input.id ? replyTemplateService.update(input.id, input.values) : replyTemplateService.create(input.values),
    onSuccess: () => {
      refresh();
      toast('Respuesta guardada');
    },
    onError: fail,
  });
  const remove = QuerySupport.useMutation({
    mutationFn: (id: string) => replyTemplateService.remove(id),
    onSuccess: () => {
      refresh();
      toast('Respuesta borrada', 'info');
    },
    onError: fail,
  });

  return {
    items: query.data?.items ?? [],
    /** Pertenece a una inmobiliaria: puede compartir con su equipo. */
    canShare: query.data?.canShare ?? false,
    loading: query.isLoading,
    failed: query.isError,
    retry: () => void query.refetch(),
    saving: save.isPending,
    removing: remove.isPending,
    /** Crea (sin `id`) o edita; `done` corre solo si salió bien. */
    save: (id: string | undefined, values: ReplyTemplateInput, done: () => void) => save.mutate({ id, values }, { onSuccess: done }),
    remove: (id: string, done: () => void) => remove.mutate(id, { onSuccess: done }),
  };
}

export type TemplatesView = ReturnType<typeof useTemplates>;
