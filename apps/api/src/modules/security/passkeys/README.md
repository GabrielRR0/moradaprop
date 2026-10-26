# passkeys
Mini módulo de `security`: **entrar y verificarse con la huella, Face ID o Windows Hello** (el estándar WebAuthn/FIDO2). Código propio sobre `node:crypto`: sin librerías ni servicios de terceros y sin enviar correos.

## Cómo funciona
El dispositivo del usuario guarda una **clave privada** que nunca sale de él y la desbloquea con su huella, su cara o el PIN del equipo. El servidor solo guarda la clave **pública**: ni la huella ni la cara llegan jamás al servidor. Para entrar, el servidor manda un desafío aleatorio y el dispositivo lo **firma**; el servidor comprueba la firma. Como la firma está atada al dominio del sitio, **no se puede phishear**: una página falsa no consigue una firma válida. Cuenta como dos factores en uno (el dispositivo + la biometría). Si el portátil no tiene sensor, se puede usar la passkey del teléfono por QR.

1. **Registrar** (usuario con sesión): `POST /api/auth/passkeys/register/options` (pide la contraseña y un dispositivo confirmado) → el navegador llama `navigator.credentials.create()` → `POST .../register/verify`.
2. **Entrar sin contraseña**: `POST /api/auth/passkeys/login/options` → `navigator.credentials.get()` → `POST .../login/verify`. No hace falta escribir el correo (la passkey dice quién es).
3. **Segundo paso** cuando el inicio de sesión es muy raro (ver `access-risk`): `POST .../step-up/options` y `.../step-up/verify` con el `challengeToken` de `/auth/login`.

## Qué se verifica (cada punto tiene su test de manipulación)
Tipo de operación · **desafío** emitido por nosotros, de un solo uso y vigente (5 min) · **origen** exacto (`WEBAUTHN_ORIGINS`) y que no sea cross-origin · **sitio** (`rpIdHash` = SHA-256 de `WEBAUTHN_RP_ID`) · usuario **presente** y **verificado** (huella/cara/PIN, obligatorio) · **firma** sobre `authenticatorData + SHA-256(clientDataJSON)` con la clave pública · dueño de la passkey (`userHandle`, y el usuario del desafío en el segundo paso) · **contador**: si baja o se repite, la passkey está clonada y se **revoca** (un contador siempre en 0 es normal en passkeys sincronizadas). Todo fallo responde `401 "Passkey invalida"`; el motivo real queda en auditoría (`risk.passkey.failed`).

## Piezas
```
webauthn/   núcleo sin dependencias: cbor.ts (lector estricto), cose.ts (clave COSE → clave de Node; ES256, RS256 de
            Windows Hello y EdDSA), authenticator-data.ts, base64url.ts, verify.ts (registro y uso, funciones puras)
services/   passkey.service (fachada: opciones y verificación), passkey-challenge (desafíos de un solo uso en la DB),
            passkey-credential (almacén), passkey-enrollment (agregar/quitar con contraseña y dispositivo confirmado)
dto/        lo que manda el navegador, validado estricto (base64url con tope, sin campos de más)
passkeys.controller.ts   mis passkeys (/api/auth/passkeys: register, list, rename, delete)
```
Entrar con una passkey (`login` y `step-up`) vive en `auth` (`passkey-login.controller.ts`), porque crea la sesión.

## Reglas de seguridad al agregar o quitar passkeys
Registrar o quitar un método de verificación es lo más delicado de una cuenta: si un atacante que solo conoce la clave pudiera registrar **su** passkey, dejaría fuera al dueño. Por eso, con `RISK_MODE=enforce`, solo se permite desde un **dispositivo ya confirmado** (`TRUSTED_DEVICE_REQUIRED`) y volviendo a escribir la contraseña. Lo mismo vale para activar el 2FA con app autenticadora.

## Qué cambia en el resto
- Una cuenta con passkey **no se niega** en un inicio muy raro: se le pide la passkey (`methods: ["passkey"]`).
- Entrar con passkey deja la sesión **verificada con segundo factor** (claim `twoFactor`): `@RequireTwoFactor()` y el panel admin la aceptan igual que a un TOTP. Si la cuenta quita su última passkey y no tiene 2FA, el claim se cae en el siguiente token.
- Entrar con una passkey **no queda bloqueado** por intentos de clave fallidos (una passkey no se adivina): el dueño con su huella recupera el acceso aunque un atacante haya pausado la cuenta.

## Configuración
`WEBAUTHN_RP_ID` (dominio del sitio, sin `https://`; en local `localhost`) y `WEBAUTHN_ORIGINS` (origen exacto de la web, ej. `https://alquileres-ve.net`; varios separados por coma). **Las passkeys quedan atadas a ese dominio: cambiarlo las invalida.** El servidor no arranca en producción si siguen en `localhost`. Requiere HTTPS (en `localhost` funciona).

## Uso desde el frontend
```ts
// Registrar (usuario con sesión)
const options = await api.post('/auth/passkeys/register/options', { password });
const credential = await navigator.credentials.create({ publicKey: PublicKeyCredential.parseCreationOptionsFromJSON(options) });
await api.post('/auth/passkeys/register/verify', { credential: credential.toJSON(), label: 'Mi laptop' });

// Entrar
const options = await api.post('/auth/passkeys/login/options');
const credential = await navigator.credentials.get({ publicKey: PublicKeyCredential.parseRequestOptionsFromJSON(options) });
const session = await api.post('/auth/passkeys/login/verify', { credential: credential.toJSON() });
```
`parse…FromJSON` y `toJSON()` existen en navegadores actuales (Chrome 129+, Safari 18+, Firefox 119+); en otros hay que convertir a mano los campos base64url. Usa `credentials: 'include'` para recibir las cookies de sesión y de dispositivo.

## Límites
- **No se valida la marca del dispositivo** (attestation `none`): solo importa la clave pública, no qué modelo la creó.
- Las passkeys **sincronizadas** (iCloud, Google Password Manager) son tan seguras como esa cuenta; por eso se permiten hasta 10 por usuario y se mantienen el 2FA y los códigos de respaldo.
- Recuperar una cuenta sin ningún factor sigue pasando por el restablecimiento de contraseña por correo que ya existe.
- Las apps nativas necesitarán dominios asociados (`apple-app-site-association`, `assetlinks.json`) cuando se hagan.

## Tests y validación
- `tests/webauthn-verify.spec.ts` y `cbor-cose.spec.ts`: registro y uso con los 3 algoritmos y **cada manipulación** (desafío, origen, sitio, UV, firma, datos alterados, otra clave, CBOR hostil, claves débiles...). Usan un **autenticador de software** (`test/support/fake-authenticator.ts`).
- `tests/real-vectors.spec.ts`: **respuestas reales** de Firefox y llaves de seguridad (datos de prueba públicos de SimpleWebAuthn, MIT; solo se usan los datos). Verifican que leemos bien lo que mandan los autenticadores de verdad y que la firma real valida con nuestro código.
- `test/e2e/passkeys.e2e-spec.ts`: de punta a punta (registro, entrar, replay, clon, admin solo con passkey, segundo paso, bloqueo, gestión y validación del cuerpo).
