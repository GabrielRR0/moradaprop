# pantallas

Un archivo `.dc.html` por pantalla del diseño. Cada uno trae, en este orden:

1. `<helmet><style>` — CSS de la pantalla (clases como `.btn`, `.card`, animaciones `@keyframes`).
2. `<x-dc>` — el marcado. `{{huecos}}` se rellenan con datos; `<sc-for>` repite; `<sc-if>` condiciona.
3. `<script type="text/x-dc">` — la lógica de ejemplo (`class Component extends DCLogic`): estado, datos de muestra y
   handlers. `data-props` declara los ajustes del diseño (color de marca y modo noche).

Los archivos que empiezan con `M` son la versión móvil; los terminados en `Noche` son copias con el modo noche activo.
Son **la fuente de verdad visual**: la app (`apps/web/src/modules`) se generó desde ellos con
`scripts/diseno-a-react`. No se editan para "arreglar" la app; se editan para cambiar el diseño.
