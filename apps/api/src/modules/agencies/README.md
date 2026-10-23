# agencies
Agencias con subcuentas.

- GET/PATCH /api/agencies/me: perfil, equipo y uso del plan (la agencia sale de la cuenta, nunca de la URL).
- Invitar agentes por correo (token de un solo uso, solo se guarda su hash), aceptar invitación (el correo debe coincidir), quitar agentes.
- Límites de plan: maxAgents y maxProperties (no editables por la agencia).
