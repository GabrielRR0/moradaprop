export type MailTemplate =
  | { name: 'verify-email'; code: string; minutes: number }
  | { name: 'reset-password'; code: string; minutes: number }
  | { name: 'two-factor-code'; code: string; minutes: number }
  | { name: 'test-email' }
  | { name: 'link-google'; code: string; minutes: number }
  | { name: 'agency-invitation'; agencyName: string; link: string }
  | { name: 'appointment-new'; propertyTitle: string; kind: string; clientName: string; link: string }
  | { name: 'appointment-response'; propertyTitle: string; kind: string; accepted: boolean; note?: string; link: string };

/** Escapa HTML: titulos y nombres vienen de usuarios y no deben inyectar etiquetas en el correo. */
const esc = (value: string) =>
  value.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] as string);

const layout = (appName: string, title: string, body: string) => `
<div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;padding:24px">
  <h2 style="margin:0 0 16px">${appName}</h2>
  <h3 style="margin:0 0 12px">${title}</h3>
  ${body}
  <p style="color:#888;font-size:12px;margin-top:24px">Si no fuiste tu, ignora este mensaje.</p>
</div>`;

const codeBlock = (code: string, minutes: number) =>
  `<p>Tu codigo es:</p><p style="font-size:32px;letter-spacing:6px;font-weight:bold">${code}</p>
   <p>Vence en ${minutes} minutos. No lo compartas con nadie.</p>`;

function build(appName: string, title: string, body: string, text: string) {
  return {
    subject: `${title} - ${appName}`,
    html: layout(appName, title, body),
    text: `${title}: ${text}`,
  };
}

/** Devuelve asunto, html y texto plano. Los datos llegan validados desde el service. */
export function renderTemplate(template: MailTemplate, appName: string) {
  switch (template.name) {
    case 'verify-email':
      return build(appName, 'Verifica tu correo', codeBlock(template.code, template.minutes), template.code);
    case 'reset-password':
      return build(appName, 'Restablece tu contrasena', codeBlock(template.code, template.minutes), template.code);
    case 'two-factor-code':
      return build(appName, 'Codigo de verificacion', codeBlock(template.code, template.minutes), template.code);
    case 'test-email':
      return build(appName, 'Correo de prueba', '<p>La configuracion de correo funciona.</p>', 'La configuracion de correo funciona');
    case 'link-google':
      return build(
        appName,
        'Confirma la vinculacion con Google',
        codeBlock(template.code, template.minutes),
        template.code,
      );
    case 'appointment-new':
      return build(
        appName,
        'Nueva solicitud en tu propiedad',
        `<p><b>${esc(template.clientName)}</b> envio una solicitud de <b>${esc(template.kind)}</b> para <b>${esc(template.propertyTitle)}</b>.</p><p><a href="${template.link}">Ver solicitud</a></p>`,
        template.link,
      );
    case 'appointment-response':
      return build(
        appName,
        template.accepted ? 'Tu solicitud fue aceptada' : 'Tu solicitud no fue aceptada',
        `<p>Tu solicitud de <b>${esc(template.kind)}</b> para <b>${esc(template.propertyTitle)}</b> fue ${template.accepted ? 'aceptada' : 'rechazada'}.</p>${template.note ? `<p>Mensaje: ${esc(template.note)}</p>` : ''}<p><a href="${template.link}">Ver detalle</a></p>`,
        template.link,
      );
    case 'agency-invitation':
      return build(
        appName,
        `${esc(template.agencyName)} te invito`,
        `<p>Te invitaron a unirte a <b>${esc(template.agencyName)}</b>.</p><p><a href="${template.link}">Aceptar invitacion</a></p>`,
        template.link,
      );
  }
}
