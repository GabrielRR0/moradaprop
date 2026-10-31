# mail
Única salida de correos (nodemailer/SMTP). Las plantillas tipadas viven en `templates/` y escapan HTML. Un fallo de envío se registra pero no rompe la operación.

| Uso | Qué es |
|---|---|
| `MailSupport.Module` | Módulo de Nest a importar. |
| `MailSupport.Service` | Provider que se inyecta; `mail.send(to, plantilla)`. |
| `MailSupport.Template` | Tipo de las plantillas válidas (`{ name: 'link-google', ... }`). |

| `MailSupport.ConfigSourceToken` | Token opcional: quien lo provee (módulo `settings`) puede reemplazar la conexión SMTP del entorno, p. ej. con la API key de Resend que guarda el admin. Sin nada guardado se usan las variables `MAIL_*`. |

`send` registra el fallo y sigue; `sendOrThrow` lo deja pasar (la usa el botón de correo de prueba). La conexión se reutiliza mientras los datos no cambien.

**Envuelve** `nodemailer`.
