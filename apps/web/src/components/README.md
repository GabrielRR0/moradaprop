# components

Componentes de interfaz compartidos por todos los módulos de la web.

| Componente          | Para qué sirve                                                                                                                            |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `Responsive`        | Recibe la versión de escritorio y la móvil de una pantalla y muestra una u otra por CSS (corte 900 px, sin parpadeo).                     |
| `DesktopOnlyNotice` | Aviso animado para pantallas solo de escritorio (ej. moderación del administrador) cuando se abren en el teléfono.                        |
| `Toaster`           | Dibuja los avisos de `lib/toast` con animación de resorte (`motion`). Va una sola vez en el layout.                                       |
| `ThemePicker`       | Botón flotante para probar color de marca y modo noche mientras se decide el diseño. Se oculta con `NEXT_PUBLIC_SHOW_THEME_PICKER=false`. |
| `RevealObserver`    | Hace aparecer con animación los bloques con `data-reveal` al hacer scroll.                                                                |
| `LoginPrompt`       | Aviso (Sheet) "ingresa para continuar" que abre `askLogin()` cuando alguien sin sesión toca favoritos, alertas, etc. Va en `Providers`.   |

Animaciones globales de la app: transición de página (`app/template.tsx`), aviso al guardar/cambiar, aparición al
hacer scroll, cambio suave claro/oscuro y las animaciones propias de cada pantalla (en su `.css`).
Todas respetan `prefers-reduced-motion`.

## `ui/` — piezas de formulario (auth y seguridad)

`Button` (con carga y respuesta al toque), `Field` (error animado, ver contraseña), `CodeInput` (casillas de 6 dígitos con pegar y autoavance), `Notice` (aviso en línea), `PasswordStrength`, `StepSwitcher` (deslizamiento entre pasos), `SuccessBurst` y `Sheet` (panel inferior en móvil, modal en escritorio). Estilos en `ui/ui.css` (clases `ui-*`, solo tokens de `globals.css`). El movimiento se reduce solo si el usuario lo pide (`MotionConfig` en `Providers`).
