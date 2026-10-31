# services
La lógica del módulo. Los controllers solo hablan con la fachada `appointments.service.ts`.

```
services/
  appointments.service.ts     fachada
  booking/                    lo que hace el cliente
    appointment-create.service.ts    pedir una visita o un apartado (evita duplicados y exceso de pendientes)
    appointment-client.service.ts    ver sus solicitudes y cancelarlas
  leads/                      lo que hace quien gestiona la propiedad
    appointment-leads.service.ts     ver los leads, responderlos (confirmar pasa el apartado a RESERVADA) y completarlos
  reader/
    appointment-reader.service.ts    lee citas y las deja como las ve el cliente o quien gestiona (usado por booking y leads)
  access/
    appointment.policy.ts            quién puede cancelar, responder o completar una cita
```

Los dos lados están separados porque ven datos distintos: el cliente no ve datos internos y quien gestiona ve además el contacto del solicitante.
