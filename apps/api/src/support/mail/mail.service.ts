import { Inject, Injectable, Logger, Optional } from '@nestjs/common';
import { createTransport, type Transporter } from 'nodemailer';
import { AppConfig } from '@/config';
import { MAIL_CONFIG_SOURCE, type MailConfigSource, type MailConnection } from './mail-config-source';
import { renderTemplate, type MailTemplate } from './templates';

/** Unica puerta de salida de correos. Se puede cambiar de proveedor sin tocar los modulos. */
@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private ready: { signature: string; transporter: Transporter } | null = null;

  constructor(
    private readonly config: AppConfig,
    @Optional() @Inject(MAIL_CONFIG_SOURCE) private readonly source?: MailConfigSource,
  ) {}

  /** Envia el correo; si falla lo registra y sigue (un correo caido no debe romper el registro). */
  async send(to: string, template: MailTemplate): Promise<void> {
    try {
      await this.sendOrThrow(to, template);
    } catch (error) {
      this.logger.error(`No se pudo enviar "${template.name}" a ${to}: ${(error as Error).message}`);
    }
  }

  /** Igual que `send`, pero deja pasar el error (para la prueba de configuracion del admin). */
  async sendOrThrow(to: string, template: MailTemplate): Promise<void> {
    const connection = await this.connection();
    const { subject, html, text } = renderTemplate(template, this.config.app.name);
    await this.transporterFor(connection).sendMail({ from: connection.from ?? this.config.mail.from, to, subject, html, text });
  }

  /** Lo guardado por el admin manda; si no hay nada, las variables MAIL_*. */
  private async connection(): Promise<MailConnection> {
    const saved = await this.source?.current().catch(() => null);
    if (saved) return saved;
    const { host, port, user, password } = this.config.mail;
    return { host, port, user: user ?? '', password: password ?? '' };
  }

  /** Reutiliza la conexion mientras los datos no cambien (al guardar otra clave se crea una nueva). */
  private transporterFor({ host, port, user, password }: MailConnection): Transporter {
    const signature = [host, port, user, password].join('|');
    if (this.ready?.signature === signature) return this.ready.transporter;
    const transporter = createTransport({ host, port, secure: port === 465, auth: user ? { user, pass: password } : undefined });
    this.ready = { signature, transporter };
    return transporter;
  }
}
