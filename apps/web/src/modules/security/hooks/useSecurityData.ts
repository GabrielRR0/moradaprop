import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { securityService } from '../services/security.service';

/** Claves de cache de la pantalla de seguridad (una por lista, para refrescarlas por separado). */
export const securityKeys = {
  passkeys: ['security', 'passkeys'] as const,
  devices: ['security', 'devices'] as const,
  sessions: ['security', 'sessions'] as const,
  events: ['security', 'events'] as const,
};

/** Estas listas deben verse al dia: siempre se piden de nuevo al abrir la pantalla. */
const fresh = { staleTime: 0, retry: 0 } as const;

export const usePasskeys = () =>
  useQuery({ queryKey: securityKeys.passkeys, queryFn: securityService.passkeys, ...fresh });
export const useDevices = () =>
  useQuery({ queryKey: securityKeys.devices, queryFn: securityService.devices, ...fresh });
export const useSessions = () =>
  useQuery({ queryKey: securityKeys.sessions, queryFn: securityService.sessions, ...fresh });
export const useEvents = () =>
  useQuery({ queryKey: securityKeys.events, queryFn: securityService.events, ...fresh });

/** Mutacion que, al terminar bien, vuelve a pedir la lista indicada. */
export function useRefreshing<TArg, TResult>(
  action: (arg: TArg) => Promise<TResult>,
  key: readonly string[],
) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: action,
    onSuccess: () => client.invalidateQueries({ queryKey: key }),
  });
}
