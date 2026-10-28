import { Injectable, Logger } from '@nestjs/common';
import { createTransport, type Transporter } from 'nodemailer';
import { AppConfig } from '../../config';
import { renderTemplate, type MailTemplate } from './templates';

/** Unica puerta de salida de correos. Se puede cambiar de proveedor sin tocar los modulos. */
@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly transporter: Transporter;

  constructor(private readonly config: AppConfig) {
    const { host, port, user, password } = config.mail;
    this.transporter = createTransport({
      host,
      port,
      secure: port === 465,
      auth: user ? { user, pass: password } : undefined,
    });
  }

  async send(to: string, template: MailTemplate): Promise<void> {
    const { subject, html, text } = renderTemplate(template, this.config.app.name);
    try {
      await this.transporter.sendMail({ from: this.config.mail.from, to, subject, html, text });
    } catch (error) {
      // Un correo caido no debe romper el registro; el usuario puede pedir reenvio.
      this.logger.error(`No se pudo enviar "${subject}" a ${to}: ${(error as Error).message}`);
    }
  }
}
