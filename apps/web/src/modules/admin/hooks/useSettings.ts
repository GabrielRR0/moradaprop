import { useEffect, useState } from 'react';
import { adminSettingsService, withRecentSecondFactor, type MailTestResult } from '@/lib/admin';
import { ApiError } from '@/lib/api';
import { toast } from '@/lib/toast';
import { describeError, isCancelled, useConfirmIdentity } from '@/modules/auth';
import { QuerySupport } from '@/support/query';

const KEY = ['admin', 'settings'];
const API_KEY = 'mail.resendApiKey';
const FROM_ADDRESS = 'mail.fromAddress';
const FROM_NAME = 'mail.fromName';

/** Por que no se pudieron cargar los ajustes (para explicarlo en la pantalla). */
export type LoadError = 'two-factor' | 'prefix' | 'other' | null;

/**
 * Ajustes de la plataforma que el admin cambia desde la web: hoy, el correo con Resend (clave, remitente y nombre).
 * Todo se guarda cifrado en la base y, si hay algo guardado, manda sobre las variables MAIL_* del servidor.
 * Guardar y quitar piden confirmar el segundo factor (si hace mas de 5 minutos que se confirmo).
 */
export function useSettings() {
  const client = QuerySupport.useQueryClient();
  const identity = useConfirmIdentity();
  const query = QuerySupport.useQuery({ queryKey: KEY, queryFn: () => adminSettingsService.list(), retry: false });

  const byKey = new Map((query.data ?? []).map((setting) => [setting.key, setting]));
  const savedKey = byKey.get(API_KEY);
  const savedAddress = byKey.get(FROM_ADDRESS)?.value ?? '';
  const savedName = byKey.get(FROM_NAME)?.value ?? '';

  // Lo que se escribe en los campos. La clave de Resend nunca se rellena: la API no la devuelve completa.
  const [apiKey, setApiKey] = useState('');
  const [fromAddress, setFromAddress] = useState('');
  const [fromName, setFromName] = useState('');
  const [loaded, setLoaded] = useState(false);
  const [testResult, setTestResult] = useState<MailTestResult | null>(null);

  // Al llegar los ajustes, los campos de texto empiezan con lo guardado (una sola vez; despues manda lo que escribe el admin).
  useEffect(() => {
    if (!query.data || loaded) return;
    setFromAddress(savedAddress);
    setFromName(savedName);
    setLoaded(true);
  }, [query.data, loaded, savedAddress, savedName]);

  /** Lo que cambio el admin, listo para guardar. Un campo vacio no borra nada (para quitar la clave hay un boton aparte). */
  const changes: Array<[string, string]> = [];
  if (apiKey.trim()) changes.push([API_KEY, apiKey.trim()]);
  if (fromAddress.trim() && fromAddress.trim() !== savedAddress) changes.push([FROM_ADDRESS, fromAddress.trim()]);
  if (fromName.trim() && fromName.trim() !== savedName) changes.push([FROM_NAME, fromName.trim()]);

  const refresh = () => void client.invalidateQueries({ queryKey: KEY });
  const fail = (error: unknown, fallback: string) => {
    if (!isCancelled(error)) toast(describeError(error, fallback).text, 'warn');
  };

  const save = QuerySupport.useMutation({
    mutationFn: async () => {
      for (const [key, value] of changes) await withRecentSecondFactor(() => adminSettingsService.save(key, value), identity.confirm);
    },
    onSuccess: () => {
      setApiKey('');
      setTestResult(null);
      toast('Ajustes guardados');
      refresh();
    },
    onError: (error) => {
      fail(error, 'No pudimos guardar los ajustes.');
      refresh(); // si se guardo una parte antes del fallo, que la pantalla lo refleje
    },
  });

  const remove = QuerySupport.useMutation({
    mutationFn: () => withRecentSecondFactor(() => adminSettingsService.remove(API_KEY), identity.confirm),
    onSuccess: () => {
      setTestResult(null);
      toast('Clave quitada: el correo vuelve a usar las variables del servidor', 'info');
      refresh();
    },
    onError: (error) => fail(error, 'No pudimos quitar la clave.'),
  });

  const test = QuerySupport.useMutation({
    mutationFn: () => adminSettingsService.testMail(),
    onSuccess: setTestResult,
    onError: (error) => fail(error, 'No pudimos enviar la prueba.'),
  });

  const error = query.error;
  const loadError: LoadError = !error
    ? null
    : error instanceof ApiError && error.code === 'TWO_FACTOR_REQUIRED'
      ? 'two-factor'
      : error instanceof ApiError && error.status === 404
        ? 'prefix'
        : 'other';

  return {
    identity,
    loading: query.isLoading,
    loadError,
    retry: () => void query.refetch(),

    /** Hay una clave de Resend guardada: el correo sale por Resend en vez de por las variables del servidor. */
    viaResend: Boolean(savedKey?.configured),
    keyPreview: savedKey?.preview ?? null,

    apiKey,
    setApiKey,
    fromAddress,
    setFromAddress,
    fromName,
    setFromName,

    dirty: changes.length > 0,
    saving: save.isPending,
    save: () => save.mutate(),
    removing: remove.isPending,
    removeKey: () => remove.mutate(),
    testing: test.isPending,
    sendTest: () => test.mutate(),
    testResult,
  };
}

export type SettingsView = ReturnType<typeof useSettings>;
