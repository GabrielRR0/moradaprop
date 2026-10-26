# file-checks
Revisiones de los archivos que suben los usuarios, ejecutadas **antes** de guardarlos y de decodificarlos (así un archivo hostil no llega ni a `sharp`). Un archivo por revisión, listadas en `index.ts` en el orden en que corren. Son código propio: usan solo lo que trae Node, sin antivirus, servicios ni paquetes de terceros.

| Revisión | Qué detecta |
|---|---|
| `dangerous-filename` | Extensiones peligrosas (`.exe`, `.php`, `.js`, `.sh`...), doble extensión (`foto.php.jpg`) y caracteres que disfrazan el nombre (ruta, nulo, U+202E que invierte el texto) |
| `executable-content` | Programas y scripts por sus primeros bytes: PE de Windows (solo si `MZ` apunta a una cabecera PE real, para no confundir un CSV que empiece con "MZ"), ELF, Mach-O, Java class, `#!` y `<?php`/`<script`/`<html` |

Cada una devuelve el motivo del rechazo o `null`. El motivo va a auditoría (`threat.file.rejected`); al usuario solo se le dice "El archivo fue rechazado por seguridad". Si una revisión **lanza error** inesperado, el archivo se rechaza con 503: nunca se deja pasar sin revisar.

## Lo que ya validaba la app (y sigue ahí)
`common/files`: tipo real por magic bytes (JPG/PNG/WebP/xlsx/csv), rechazo de `.xlsm` con macros y zip-bombs; las imágenes se re-encodean con `sharp`; los originales van a un bucket privado y los nombres guardados son UUID. Estas revisiones son una capa **previa** y no las reemplazan.

## Qué no hace
No busca virus por firma: eso requeriría un antivirus, que el proyecto decidió no usar. La defensa es no confiar en el archivo: se valida su tipo real, se re-codifican las imágenes, los originales no se sirven ni se ejecutan nunca.

## Agregar una revisión
1. Crea `file-checks/mi-revision.ts` exportando un `FileCheck` (`id`, `stride`, `description`, `inspect(file)`).
2. Súmala al arreglo `FILE_CHECKS` de `index.ts`.
3. Agrega sus casos en `tests/file-checks.spec.ts`.
