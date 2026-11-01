# ContactPanel
Todo lo que el cliente puede hacer para hablar con el anunciante desde la ficha. Lo usan la versión de escritorio y la móvil.

| Archivo | Qué hace |
|---|---|
| `ContactPanel.tsx` | Los botones **Estoy interesado**, **Tengo una pregunta** y **Pedir una visita**, WhatsApp directo y **Apartar**, más los avisos según el estado de la propiedad. |
| `ContactSheet.tsx` | La ventana para escribir: elegir qué quiere, mensaje con ejemplos para empezar rápido y, al enviar, la confirmación con el enlace a la conversación. |
| `contactpanel.css` | Estilos (prefijo `pc-`). |

**Qué muestra según el caso**
- **Sin sesión:** cualquier botón pide ingresar (el WhatsApp también: el número solo se entrega a quien tiene cuenta).
- **Ya hay una conversación abierta:** en vez de los botones, una tarjeta "Ya estás hablando con el anunciante" con un punto rojo si hay algo nuevo.
- **Propiedad reservada del todo / ya no disponible / propia:** un aviso en lugar de los botones.
- **"Ya tiene una visita programada":** etiqueta animada cuando el anunciante acordó una visita (no dice el día).

El cliente **no elige fecha**: pide la visita con un mensaje, el anunciante propone fechas y él acepta una desde `/mensajes`.
