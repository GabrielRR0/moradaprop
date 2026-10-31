# contracts
Todo lo que entra y sale de este mini módulo.

```
contracts/
  dto/         lo que ENTRA
  resources/   lo que SALE
```

| dto | Para qué ruta |
|---|---|
| passkey.dto.ts | credenciales que manda el dispositivo y datos de registro, renombrado y entrada (agrupados porque comparten clases) |

| resource | Qué describe |
|---|---|
| passkey.resource.ts | una passkey (sin material criptográfico), la lista, renombrada y registrada |
| passkey-options.resource.ts | las opciones que el navegador pasa al sistema operativo para registrar o usar una passkey |

Esta carpeta no importa de controllers ni de services; solo al revés.
