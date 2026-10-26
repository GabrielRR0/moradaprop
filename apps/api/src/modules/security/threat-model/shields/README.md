# shields
Escudos del modelo de amenazas: un archivo por defensa, todas listadas en `index.ts`.

Un escudo es **una descripción**, no código con efectos (`ThreatShield` en `../types.ts`):

| Campo | Qué es |
|---|---|
| `id` | Nombre único (`credential-guessing`) |
| `stride` | Letra STRIDE a la que pertenece (S, T, R, I, D, E) |
| `description`, `protectedBy` | Texto para el panel: qué detecta y qué defensas ya existen |
| `limit`, `windowSec` | Se actúa cuando el mismo sujeto cumple `limit` hechos en `windowSec` segundos |
| `blockMinutes` | Cuánto dura el bloqueo en modo `enforce` |
| `matches(facts)` | Opcional. ¿Esta respuesta cuenta? Recibe estado, método, ruta, IP, usuario y roles. Sin `matches`, el escudo solo se alimenta con `ThreatModelService.report(id, sujeto)` |

| Escudo | Letra | Cuenta | Límite |
|---|---|---|---|
| `credential-guessing` | S | respuestas 401 | 20 en 5 min → 15 min |
| `mass-registration` | S | cuentas nuevas (`report` desde el registro) | 8 en 1 h → 2 h |
| `account-takeover-attempt` | S | cuentas bloqueadas por fallar el 2º factor (`report` desde `access-risk`) | 3 en 1 h → 2 h (bloquea la IP, nunca a la víctima) |
| `payload-tampering` | T | respuestas 400 | 40 en 5 min → 10 min |
| `malicious-upload` | T | archivos rechazados (`report`) | 3 en 10 min → 60 min |
| `audit-trail` | R | nada (solo documenta) | — |
| `id-enumeration` | I | 404 (salvo `/uploads`) | 30 en 5 min → 30 min |
| `request-flood` | D | respuestas 429 | 30 en 5 min → 15 min |
| `privilege-probing` | E | respuestas 403 | 10 en 5 min → 30 min |

## Agregar un escudo
1. Crea `shields/mi-escudo.ts`:
```ts
export const miEscudo: ThreatShield = {
  id: 'mi-escudo', stride: 'S', description: '...', protectedBy: ['...'],
  limit: 5, windowSec: 60, blockMinutes: 10,
  matches: (facts) => facts.status === 401 && facts.path.startsWith('/api/auth/login'),
};
```
2. Súmalo a la lista en `shields/index.ts`.
3. Agrega su caso en `tests/` (o en `threat-model.service.spec.ts`).

## Quitar un escudo
Borra su línea en `index.ts` y su archivo. Nada más lo referencia (salvo `ThreatModelService.report('<id>')` si algún service lo usaba: el modelo avisa en el log de un escudo desconocido).
