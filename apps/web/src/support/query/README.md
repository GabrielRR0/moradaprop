# query
Envuelve `@tanstack/react-query` (datos del servidor con cache). Es el único lugar que lo importa; el resto usa `QuerySupport`.

| Uso | Qué es |
|---|---|
| `QuerySupport.QueryClient`, `QuerySupport.QueryClientProvider` | Cliente y proveedor (los arma `Providers`). |
| `QuerySupport.useQuery`, `QuerySupport.useInfiniteQuery` | Leer datos. |
| `QuerySupport.useMutation` | Escribir datos. |
| `QuerySupport.useQueryClient` | Acceso al cache (invalidar, actualizar). |
| `QuerySupport.keepPreviousData` | Mantener lo anterior mientras llega lo nuevo. |

**Agregar uno:** exportarlo en `query.ts` y añadir una fila aquí.
