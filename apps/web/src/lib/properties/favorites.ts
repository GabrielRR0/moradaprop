import { api } from '@/lib/api';
import { toast } from '@/lib/toast';
import { QuerySupport } from '@/support/query';

const KEY = ['favorites'] as const;

type FavoritesResponse = { items?: Array<{ id: string }> } | Array<{ id: string }>;

/**
 * Favoritos reales de la cuenta (GET/POST/DELETE /properties/:id/favorite). Sin sesion no hay lista y
 * al tocar el corazon se llama a `onNeedLogin` (la pantalla decide a donde llevar al usuario).
 */
export function useFavorites(authed: boolean, onNeedLogin: () => void) {
  const client = QuerySupport.useQueryClient();
  const query = QuerySupport.useQuery({
    queryKey: KEY,
    enabled: authed,
    queryFn: async () => {
      const result = await api<FavoritesResponse>('/properties/favorites');
      const list = Array.isArray(result) ? result : (result.items ?? []);
      return list.map((p) => p.id);
    },
  });
  const ids = query.data ?? [];

  async function toggle(id: string) {
    if (!authed) {
      toast('Ingresa para guardar tus favoritos', 'info');
      onNeedLogin();
      return;
    }
    const was = ids.includes(id);
    // Se actualiza al instante y se confirma con el servidor.
    client.setQueryData<string[]>(KEY, (old = []) => (was ? old.filter((x) => x !== id) : [...old, id]));
    try {
      await api(`/properties/${id}/favorite`, { method: was ? 'DELETE' : 'POST' });
      toast(was ? 'Quitada de favoritos' : 'Guardada en favoritos');
    } catch {
      toast('No pudimos actualizar tus favoritos', 'warn');
    } finally {
      void client.invalidateQueries({ queryKey: KEY });
    }
  }

  return { ids, isFavorite: (id: string) => ids.includes(id), toggle };
}
