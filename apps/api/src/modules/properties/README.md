# properties
Núcleo del negocio: publicar y buscar propiedades.

**Lectura pública** (REST y GraphQL): búsqueda con filtros (precio por moneda, habitaciones, amenities venezolanas, caja del mapa), ficha y mapa con clusters (utils/clusters.ts). Las pausadas no existen para visitantes; las reservadas siguen visibles con inReservation.
**Escritura** (REST): crear, editar, cambiar estado (transiciones validadas), asignar agente, borrar, imágenes y favoritos. Dueño/agencia/agente salen del token; property-policy.service decide quién puede gestionar qué.
**Imágenes:** se procesan con common/images y se guardan por propiedad (original privado + 3 variantes públicas).
**GraphQL:** properties.resolver.ts + graphql/ (solo lectura; no expone datos internos).
