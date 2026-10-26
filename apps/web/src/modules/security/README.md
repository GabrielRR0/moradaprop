# Módulo `security`

Pantallas y avisos de seguridad de la cuenta. Guía de comportamiento: [docs/FRONTEND-SEGURIDAD.md](../../../../../docs/FRONTEND-SEGURIDAD.md) (secciones 7 a 9).

## Qué contiene

| Ruta                 | Página         | Para qué                                                                                                  |
| -------------------- | -------------- | --------------------------------------------------------------------------------------------------------- |
| `/seguridad/activar` | `EnrollPage`   | "Protege tu cuenta": activar passkey (huella / Face ID) o app autenticadora. Obligatoria para admin, dueños y agencias. |
| `/seguridad`         | `AccountPage`  | "Seguridad de la cuenta": estado del 2º factor, passkeys, app, dispositivos, sesiones, avisos, contraseña. |

Además monta dos piezas globales en `app/layout.tsx`:

- `EnrollmentBanner` — aviso flotante del segundo factor (con cuenta regresiva si hay plazo; cerrable si es solo recomendación).
- `SecurityWatcher` — tras iniciar sesión mira `GET /auth/security-events` y avisa del evento nuevo (toast o alerta con "Revisar").

```
security/
  index.ts                  # PADRE (con 'use client')
  components/
    EnrollScreen/           # "Protege tu cuenta"
    AccountScreen/          # una tarjeta por archivo (PasskeysCard, TotpCard, DevicesCard, SessionsCard, EventsCard...)
    shared/                 # SecurityShell, Card/ListState/ConfirmSheet, BackupCodes, TotpSetup, PasskeyAddForm, security.css
  hooks/                    # useSecurityData (TanStack Query), usePasskeyAdd, useAction
  services/                 # security.service (rutas del API), event-copy (texto de cada aviso), deadline
  tests/
```

## Cómo funciona

- Todo pasa por el cliente HTTP único `lib/api.ts`. Las listas se piden con TanStack Query y se refrescan al cambiar algo.
- Los **códigos de respaldo** se muestran una sola vez y no se pueden saltar hasta confirmar que se guardaron; nunca se guardan en el navegador.
- Quitar el dispositivo o la sesión actual cierra la sesión local y manda a `/ingresar`.
- Los textos por tipo de aviso están en `services/event-copy.ts`; un tipo desconocido usa el `title` del servidor.
- `AuthGate allowBlocked` deja pasar a cuentas limitadas (son justo para ellas).

## Reglas

- Las rutas de este módulo son de las pocas que el API deja usar mientras una cuenta está limitada (`SECOND_FACTOR_ENROLLMENT_REQUIRED`).
- Ocultar un botón no protege nada: el API decide.
