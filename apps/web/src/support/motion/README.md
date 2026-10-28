# motion
Envuelve `motion` (animaciones). Es el único lugar que importa `motion/react`; el resto usa `MotionSupport`. Si la librería cambia de paquete o de API, se arregla en `motion.ts`.

| Uso | Qué es |
|---|---|
| `MotionSupport.motion.div` (`.button`, `.li`, `.span`, `.ul`, `.section`, `.path`) | Elementos animados. |
| `MotionSupport.AnimatePresence` | Animar la entrada y salida de elementos. |
| `MotionSupport.MotionConfig` | Configuración global (la usa `Providers`). |
| `MotionSupport.useAnimationControls()` | Control imperativo de una animación. |

**Agregar uno:** exportarlo en `motion.ts` y añadir una fila aquí.
