# contracts
Todo lo que entra y sale del módulo.

```
contracts/
  dto/         lo que ENTRA   (valida body, query y params)
  resources/   lo que SALE    (la forma de cada respuesta)
```

| dto | Para qué ruta |
|---|---|
| update-profile.dto.ts | editar nombre y teléfono |
| change-password.dto.ts | cambiar la contraseña |

| resource | Qué describe |
|---|---|
| user-profile.resource.ts | el perfil del usuario con sus agencias y cuentas vinculadas (sin hashes ni secretos) |
| password-changed.resource.ts | confirmación de que la contraseña cambió |

Esta carpeta no importa de controllers ni de services; solo al revés.
