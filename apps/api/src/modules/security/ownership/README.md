# ownership
Mini módulo de `security`: evita que un usuario toque datos que no son suyos. Es el único lugar donde se decide la pertenencia.

**Idea:** el usuario sale siempre del token (`@CurrentUser()`), nunca del body ni de la URL. Pero el `id` del recurso sí viene de la URL, así que antes de leer o modificar algo hay que comprobar que el recurso es de ese usuario. Eso se hace con `OwnershipService.require`.

**Piezas**
- `types.ts` — `ResourcePolicy<T>`: la regla de UN recurso (`find` y `can`). Cada módulo de negocio escribe la suya junto a sus datos.
- `services/ownership.service.ts` — `require(policy, user, id, action, ctx?)`: devuelve el recurso o lanza 404 (o 403 si la política define `forbidden`). Cada rechazo se guarda en auditoría como `access.denied`.

**Cómo funciona**
1. El service llama `ownership.require(policy, user, id, 'accion', ctx)`.
2. Si el recurso no existe → 404.
3. Si existe y el usuario no puede → se audita `access.denied` y se responde 404, igual que "no existe", para no confirmar que ese id existe. Solo los recursos con id público (propiedades) usan 403 con `forbidden`.

**Agregar un recurso nuevo** (en el módulo del recurso):
```ts
@Injectable()
export class InvoicePolicy implements ResourcePolicy<Invoice> {
  readonly resource = 'Invoice';
  readonly notFound = 'Factura no encontrada';
  constructor(private readonly prisma: PrismaService) {}

  find(id: string) { return this.prisma.invoice.findUnique({ where: { id } }); }
  can(user: AuthUser, invoice: Invoice, action: string) {
    return action === 'read' && invoice.userId === user.id;   // acción desconocida = false
  }
}
// en el service:  const invoice = await this.ownership.require(this.policy, user, id, 'read', ctx);
```
El módulo del recurso importa `SecurityModule` y usa `import { OwnershipService, type ResourcePolicy } from '../security'`.

**Quitar o cambiar**: la regla vive en la política del recurso; cambiarla no toca nada más. Quitar una política = volver a buscar el recurso a mano en ese service.

**Listados** no usan `require`: filtran con `where` por dueño (`{ clientId: user.id }`, `managedFilter`, `scope`). Es la regla equivalente para varios registros.

**Recursos migrados:** citas (`AppointmentPolicy`) y propiedades (`PropertyAccessPolicy`). Ya filtran por dueño en la consulta, sin necesitar política: importaciones (`scope`), favoritos, sesiones propias, imágenes (`id` + `propertyId` tras gestionar la propiedad) y miembros de agencia.

**Conexión con `threat-model`:** los eventos `access.denied` quedan en auditoría; además, un recurso ajeno responde 404 y el escudo `id-enumeration` cuenta esos 404 por usuario o IP, así que quien recorre ids acaba bloqueado.
