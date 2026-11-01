# Módulo `inbox` (Mensajes)

La bandeja y la conversación entre el cliente y quien publica la propiedad. El cliente empieza desde la ficha (`modules/properties`); aquí se responde y se coordina la visita.

| Ruta | Pantalla | Para qué |
|---|---|---|
| `/mensajes` | `InboxScreen` | Bandeja. Quien publica ve **Recibidos** (de los interesados) y **Enviados**; el resto, solo Enviados. Marca lo que tiene mensajes nuevos. |
| `/mensajes/[id]` | `ConversationScreen` | Una conversación: mensajes, fechas propuestas, redactor y herramientas. |
| `/mensajes/respuestas` | `TemplatesScreen` | Respuestas guardadas: crear, editar, compartir con el equipo y borrar. |

```
inbox/
  index.ts                         PADRE: lo único que importa `app/`
  components/
    inbox.css                      estilos (prefijo ib-, modo noche incluido)
    shared/Shell.tsx               marco común (barra superior, "volver") y el botón Recargar
    InboxScreen/                   la bandeja
    ConversationScreen/            la conversación: MessageList, Composer, ManagerPanel, ProposeSheet
    TemplatesScreen/               administrar las respuestas guardadas
    templates/                     piezas de las respuestas guardadas: TemplateList, TemplateForm (crear/editar) y TemplatePicker (elegir en la conversación)
  hooks/
    useInbox.ts                    pestañas, filas ya con sus textos y conteo de nuevos
    useConversation.ts             la conversación, enviar, aceptar, proponer, cerrar/cancelar y el estado de la propiedad
    useProposal.ts                 elegir día y horas al proponer fechas
    useEditWindow.ts               cuenta regresiva de los 3 minutos para editar un mensaje (solo corre mientras queda tiempo)
    useTemplates.ts                las respuestas guardadas: listar, guardar, borrar y buscar
```

## Cómo funciona
- **Sin tiempo real.** Las respuestas tardan, así que todo se carga al abrir y se actualiza con **Recargar** (el icono gira mientras trae datos). Por correo llega el aviso de novedades.
- **El cliente nunca elige fecha.** Quien gestiona toca **Proponer fechas** (un día, las horas que le sirven, hasta 5); el cliente ve las opciones dentro de la conversación y toca **Aceptar** en una. Queda un aviso de "Visita acordada" y la propiedad muestra en su ficha que ya tiene una visita programada (sin el día).
- **Estado de la propiedad.** Quien gestiona elige entre *Disponible*, *Reservada* (aún acepta citas) y *Reservada del todo* (no recibe más solicitudes) sin salir de la conversación.
- **WhatsApp.** Quien gestiona puede invitar al cliente a WhatsApp con un toque (el número sale de la ficha de su propiedad) y ver el contacto del interesado.
- **Editar mensajes.** Debajo de cada mensaje propio aparece **Editar · 2:41** durante los 3 minutos siguientes al envío; al tocarlo, la burbuja se convierte en un editor con la cuenta regresiva. Pasado el tiempo el botón desaparece (y el editor se cierra solo). El servidor decide y vuelve a comprobar el plazo al guardar: la pantalla solo lo muestra, y cuenta con la hora del servidor (`serverTime`), no con el reloj del dispositivo. Los mensajes editados llevan la marca "editado".
- **Respuestas guardadas.** Quien responde guarda los textos que repite (horarios, requisitos, "sigue disponible"). Pueden ser **privadas** o **compartidas** con todo el equipo de su inmobiliaria (el administrador también puede editarlas). Dentro de la conversación aparecen como atajos sobre el cuadro de texto y en **Mis respuestas**; también se guarda lo que se estaba escribiendo con **Guardar como respuesta**. `{nombre}` y `{propiedad}` se completan solos. Se guardan cifradas.
- **Animaciones** con `MotionSupport` (entrada escalonada, píldora que se desliza, check de éxito); se apagan con "reducir movimiento".

## Reglas
- Las llamadas al API viven en `lib/appointments`; este módulo solo las orquesta.
- Fuera del módulo solo se importa `index.ts`.
- Máximo 600 líneas por archivo.
