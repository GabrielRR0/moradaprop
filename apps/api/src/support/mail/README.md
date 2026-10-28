# mail
Única salida de correos (nodemailer/SMTP). Las plantillas tipadas viven en `templates/` y escapan HTML. Un fallo de envío se registra pero no rompe la operación.

| Uso | Qué es |
|---|---|
| `MailSupport.Module` | Módulo de Nest a importar. |
| `MailSupport.Service` | Provider que se inyecta; `mail.send(to, plantilla)`. |
| `MailSupport.Template` | Tipo de las plantillas válidas (`{ name: 'link-google', ... }`). |

**Envuelve** `nodemailer`.
