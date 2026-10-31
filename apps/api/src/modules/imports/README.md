# imports
Importación masiva de propiedades desde Excel/CSV (solo agencias).

**Flujo:** import-upload valida el archivo por contenido real (magic bytes, sin macros, anti zip-bomb), lo guarda en el bucket privado y llama a import-processor (lee la hoja, valida fila por fila con las mismas reglas que publicar, inserta por lotes). Las fórmulas de Excel se rechazan; textos que empiezan con = + - @ se neutralizan. Límites: 5 MB, 500 filas, plan de la agencia. Plantillas descargables e historial con errores por fila.

**Estructura:** `controllers/` (rutas por acceso: `private/agency`), `contracts/` (`dto/` y `resources/`), `decorators/` (`@UploadImportFile`), `services/` (fachada + `intake/`, `history/` y `templates/`) y `utils/` (lectura de hojas y mapeo de filas). Cada carpeta tiene su README.
