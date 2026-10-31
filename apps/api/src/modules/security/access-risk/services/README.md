# services
`access-risk.service.ts` es la fachada: lo único que `auth` usa. Decide con qué TIENE el usuario y delega el trabajo.

```
services/
  access-risk.service.ts      fachada (modo, medir, métodos de segundo paso, exigir dispositivo confirmado, describir)
  assessment/                 medir un inicio de sesión
    risk-assessor.service.ts       reúne lo que se sabe del inicio de sesión (país, red, dispositivo, historial, fallos) y lo puntúa
    footprint.service.ts           países y redes ya vistos de cada usuario (la red solo como HMAC: la base no acumula IPs)
  devices/
    device-registry.service.ts     dispositivos de confianza: registrar, confirmar, listar y quitar
  login/                      lo que pasa cuando el inicio de sesión sigue adelante
    login-trust.service.ts         al completarse: registra el dispositivo, recuerda pais y red, deja constancia
    refresh-guard.service.ts       al renovar la sesión: solo desde su dispositivo; si no, se revoca (enforce)
    step-up.service.ts             un segundo factor fallido en un inicio ALTO: a los N fallos se bloquea la cuenta
  events/
    security-events.service.ts     historial de seguridad del propio usuario
```
