# Documentación

| Documento | Para quién | Qué contiene |
|---|---|---|
| [GUIA-COLABORADORES.md](GUIA-COLABORADORES.md) | Cualquiera que vaya a trabajar en el proyecto | Cómo levantarlo, comandos, estructura, cómo escribir código legible, migraciones, pruebas y la lista previa a cada cambio |
| [SEGURIDAD.md](SEGURIDAD.md) | **Todo el que toque el backend** | Capas de defensa, autenticación y 2FA, protección de datos y archivos, lista de despliegue, reglas y prohibiciones, límites conocidos |
| [FRONTEND-SEGURIDAD.md](FRONTEND-SEGURIDAD.md) | **Quien construye la web o la app** | Cómo debe ser el login, el registro y el manejo de seguridad en el frontend: cabeceras y cookies, máquina de estados del login, passkeys, segundo factor obligatorio, avisos, errores por `code` y checklist de pantallas |
| [API.md](API.md) | Frontend, móvil y revisores | Todas las rutas, quién puede usarlas y cabeceras obligatorias |
| [RENDIMIENTO.md](RENDIMIENTO.md) | Quien optimiza o escala | Caché, límites de peticiones, qué se cambia dónde, límites honestos |
| [BACKEND-MODULAR.md](BACKEND-MODULAR.md) | **Quien monta o amplía un backend** | El sistema modular completo y cómo repetirlo en un proyecto nuevo: estructura, reglas, qué hace cumplir el código, qué copiar y lista para crear un módulo |
| [CONVENCIONES.md](CONVENCIONES.md) | Todos | Reglas de arquitectura (las impone el lint), estilo, migraciones |
| [diseno/README.md](diseno/README.md) | Frontend | Diseño de origen y decisiones |

Cada módulo y carpeta de código tiene además su propio `README.md` que explica qué contiene y cómo funciona.

**Regla:** si cambias algo que está documentado, actualiza el documento **en el mismo cambio**. Un documento desactualizado es peor que no tener documento.
