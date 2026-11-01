# utils
Funciones puras que comparten varios services del módulo.

| Archivo | Qué contiene |
|---|---|
| `appointment-mapper.ts` | Convierte una cita de la base en lo que ve el cliente o quien gestiona (`toClientView`, `toLeadView`): último mensaje, si hay algo nuevo y la propiedad resumida. |
| `thread-mapper.ts` | Convierte una cita con todos sus mensajes y fechas en la conversación que ve cada lado (`toThread`). El contacto del interesado solo sale para quien gestiona. |
| `conversation.ts` | Reglas de la conversación: estados abiertos, tope de mensajes, validar una fecha de visita (futura y dentro de 90 días), de qué lado está quien mira (`sideOf`), qué cambia en la cita cuando alguien escribe (`touch`) y la ventana para editar un mensaje (`EDIT_WINDOW_MS`, `editDeadline`). |
