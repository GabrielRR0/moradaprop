# services
`passkey.service.ts` es la fachada que usan los demás módulos (`auth`, `second-factor`); delega en los services de cada tema.

```
services/
  passkey.service.ts          fachada
  registration/               agregar passkeys
    passkey-registration.service.ts   opciones para crear una passkey y verificación de lo que vuelve
    passkey-enrollment.service.ts     lo que usa el controller: pedir contraseña y dispositivo confirmado, listar, renombrar, quitar
  authentication/
    passkey-authentication.service.ts opciones para usar una passkey y verificación de la firma (contador, copias, dueño)
  credentials/                lo que guardan y comparten
    passkey-credential.service.ts     las passkeys guardadas
    passkey-challenge.service.ts      los desafíos de un solo uso
    passkey-relying-party.service.ts  dominio y orígenes permitidos, e identificador opaco de cada usuario
```
