# spreadsheet
Envuelve `exceljs`. Leer y escribir planillas .xlsx sin que el resto del código vea el paquete. Se usa como `SpreadsheetSupport.buildXlsx(...)`.

| Función | Qué hace |
|---|---|
| `SpreadsheetSupport.readXlsxRows(buffer, { maxRows, maxColumns })` | Filas de la primera hoja como texto/número/booleano. Lanza `FormulaError` con fórmulas y `TooLargeError` si pasa `maxRows`. |
| `SpreadsheetSupport.buildXlsx(hojas)` | .xlsx en memoria. Cada hoja: `{ name, rows, boldHeader?, columnWidths? }`. |

Tipos: `SheetCell` (valor leído), `SheetValue` (valor a escribir) y `SheetSpec` (descripción de una hoja). Los errores son propios (no de Nest): el módulo que llama los traduce a su respuesta HTTP.
