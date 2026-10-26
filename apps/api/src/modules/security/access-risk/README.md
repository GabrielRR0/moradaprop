# access-risk
Mini módulo de `security`: **¿es raro este inicio de sesión?** Mide desde dónde (país, red) y con qué dispositivo entra cada usuario, lo compara con lo habitual de esa cuenta y reacciona: nada si es normal, un aviso en la app si es distinto, **segundo factor obligatorio** si es muy raro, y bloqueo si ese segundo factor falla. Todo con código propio: sin servicios ni paquetes de terceros y sin enviar correos.

## Cómo funciona
1. `LoginService.finishLogin` (punto único: clave, Google, verificar correo, 2FA) llama a `AccessRiskService.assess`.
2. Se reúne lo que se sabe: **país** (CDN, ver `security/geo`), **red** (la /24 en IPv4 o /48 en IPv6, guardada como HMAC, nunca la IP), **dispositivo** (secreto de la cookie `device_token`), historial de la cuenta (`LoginFootprint`) y fallos de clave de la última hora.
3. Cada **señal** (un archivo en `signals/`) suma o resta puntos; **`policy.ts`** tiene la tabla de puntos y los umbrales. Total: **BAJO (<30)**, **MEDIO (30–59)**, **ALTO (≥60)**.
4. Qué pasa según el nivel (con `RISK_MODE=enforce`):

| Nivel | Cuenta sin 2FA | Cuenta con 2FA |
|---|---|---|
| BAJO | entra | pide su 2FA como siempre |
| MEDIO | entra y queda un aviso en su historial | igual, con aviso |
| ALTO | **no entra** si no tiene ni 2FA ni passkey (`403 SECOND_FACTOR_REQUIRED`: que active una desde su dispositivo habitual); **con passkey** se le pide la passkey (`methods: ["passkey"]`) | pide su **passkey o 2FA** sin la opción de correo (app autenticadora o código de respaldo) |

5. **3 códigos de segundo factor fallidos** en un inicio ALTO → la cuenta se bloquea 30 min, queda auditado y se cuenta contra el escudo `account-takeover-attempt` (`threat-model`): al 3er bloqueo la **IP del atacante** se bloquea 2 h (nunca el usuario víctima).
6. Al completar el inicio de sesión se registra el **dispositivo** (secreto nuevo en cookie `httpOnly`, `/api/auth`, 30 días) y se recuerdan país y red. Solo se "aprende" de un inicio ALTO si pasó por segundo factor: el atacante no ensucia el historial.

| Señal (`signals/`) | Puntos | Cuándo |
|---|---|---|
| `new-country` | +50 | país que la cuenta nunca usó (y el país se conoce) |
| `new-network` | +20 | red (/24 o /48) nunca usada |
| `unconfirmed-device` | +40 | sin dispositivo **confirmado** (nuevo, o visto solo con la clave) |
| `impossible-travel` | +40 | otro país en <6 h desde un dispositivo no confirmado |
| `recent-failures` | +20 | ≥3 fallos de clave en la última hora |
| `confirmed-device` | −40 | dispositivo ya verificado con segundo factor |

Ejemplos: tu equipo de siempre con VPN en Canadá = 50+20−40 = **30, MEDIO** (aviso, sin fricción). Atacante con la clave, Canadá, equipo nuevo = **110+, ALTO**. Equipo nuevo en tu casa = **40, MEDIO**. La primera entrada de una cuenta es la línea base: BAJO y su dispositivo queda confirmado.

**Agregar o quitar un método de verificación** (passkey o 2FA) solo se permite desde un **dispositivo confirmado** (`AccessRiskService.assertTrustedContext`, con `enforce`): si no, un atacante con la clave registraría su propia passkey y dejaría fuera al dueño. Una passkey usada para entrar cuenta como segundo factor cumplido (ver `security/passkeys`).

## Dispositivos de confianza (en la base de datos, como Google o GitHub)
- `TrustedDevice`: etiqueta ("Chrome en Windows"), primer/último uso, país, vencimiento deslizante de 30 días, `confirmedAt`. El navegador solo lleva un **secreto aleatorio**; la base solo guarda su **hash**. Robar la fila no sirve sin el secreto, y borrar la fila invalida el secreto aunque siga en el navegador.
- Un dispositivo se **confirma** (resta riesgo) en el primer inicio de sesión de la cuenta o al pasar un segundo factor desde él. Uno que entró solo con la clave queda "visto" pero **sin confirmar**.
- Máximo 20 por usuario (se retiran primero los no confirmados más viejos). Las sesiones quedan atadas al dispositivo (`Session.deviceId`).

## Robo de sesión (refresh token)
`TokenService.refresh` llama a `AccessRiskService.checkRefresh`: una sesión con dispositivo **solo se renueva desde ese dispositivo**; si llega sin él (cookie robada y usada desde otro lado) se revoca y hay que iniciar sesión de nuevo, lo que pasa por la medición completa. Mismo dispositivo en otro país (viaje, VPN): se permite y queda un aviso. Sesiones anteriores a esta función (sin dispositivo): se revocan si cambian de país.

## Modos (`RISK_MODE`)
| Modo | Qué hace |
|---|---|
| `off` | No mide nada |
| `monitor` (por defecto) | Mide, **registra el dispositivo y el historial**, audita (`risk.assessed`) y avisa; **no niega ni exige nada**. Úsalo unos días para ajustar los puntos |
| `enforce` | Además exige segundo factor, niega, revoca refresh sospechosos y bloquea tras 3 fallos |

## Para el usuario y el admin
- `GET /api/auth/devices` (con `current`) y `DELETE /api/auth/devices/:id` (cierra sus sesiones). Siempre filtrado por el `userId` del token: uno ajeno responde 404.
- `GET /api/auth/security-events`: su historial de seguridad (inicio raro, bloqueo, dispositivo confirmado o quitado) con país y dispositivo, **sin IPs**. Reemplaza al aviso por correo.
- `GET /api/admin/security/access-risk`: modo, umbrales, puntos y señales.
- Auditoría: `risk.assessed`, `risk.denied`, `risk.stepup.passed|failed`, `risk.account.locked`, `risk.session.revoked`, `risk.device.confirmed|revoked`.

## Agregar o quitar una señal
Crea `signals/mi-senal.ts` (un `RiskSignal`: `evaluate(ctx)` devuelve `{points, reason}` o `null`), pon sus puntos en `policy.ts` y súmala a `signals/index.ts`. Quitarla = borrar su línea. Prueba su caso en `tests/risk-score.spec.ts`.

## Límites
- **Una VPN no se detecta** (haría falta una base de IPs de terceros). Se trata como "ubicación nueva" y se resuelve con dispositivo confirmado o segundo factor.
- **Sin CDN delante o sin `TRUST_PROXY=true`, el país es desconocido** y quedan red nueva, dispositivo nuevo y fallos. La cabecera de país solo se cree con `TRUST_PROXY=true`, porque si no cualquiera podría mandar el país de su víctima.
- **Cuentas que ya existían:** su primer inicio de sesión tras activar esto es la línea base. Para admin, dueños y agencias, el segundo factor obligatorio (`security/second-factor`) cubre ese hueco.
- Quien tenga la clave **y** el segundo factor entra: esto no reemplaza al 2FA, lo hace obligatorio donde importa.
- Un malware que robe la cookie de sesión **y** la de dispositivo juntas no se detecta por dispositivo (sí por cambio de país al renovar).
- Los puntos son un punto de partida: afínalos mirando `risk.assessed` en `monitor`.
