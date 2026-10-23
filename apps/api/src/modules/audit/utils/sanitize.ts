const SENSITIVE_KEY = /pass|token|code|secret|hash|key|authorization|cookie|otp|2fa|backup/i;
const MAX_DEPTH = 4;
const MAX_STRING = 300;

/**
 * Copia el objeto reemplazando por "[REDACTADO]" todo campo sensible
 * (contrasenas, tokens, codigos, secretos...). La auditoria nunca guarda eso.
 */
export function sanitize(value: unknown, depth = 0): unknown {
  if (value === null || value === undefined) return value;
  if (depth > MAX_DEPTH) return '[PROFUNDIDAD]';
  if (typeof value === 'string') return value.length > MAX_STRING ? `${value.slice(0, MAX_STRING)}...` : value;
  if (typeof value !== 'object') return value;
  if (Array.isArray(value)) return value.slice(0, 20).map((item) => sanitize(item, depth + 1));
  if (value instanceof Date) return value.toISOString();

  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>).map(([key, val]) => [
      key,
      SENSITIVE_KEY.test(key) ? '[REDACTADO]' : sanitize(val, depth + 1),
    ]),
  );
}
