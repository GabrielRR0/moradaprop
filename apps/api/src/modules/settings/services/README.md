# services
- `settings.service.ts` — leer (`get`, descifrado, solo para el código), listar, guardar y quitar ajustes; cifra los secretos y audita la clave.
- `resend-mail-source.service.ts` — entrega a `support/mail` la conexión SMTP de Resend cuando hay API key guardada.
- `mail-test.service.ts` — envía el correo de prueba al admin.
