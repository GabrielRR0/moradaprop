import { Injectable } from '@nestjs/common';
import { MailSupport } from '@/support/mail';
import { SettingsService } from './settings.service';

/**
 * Le dice al correo que use Resend cuando el admin guardo su API key. Resend se conecta por SMTP
 * (smtp.resend.com, usuario "resend", la API key como clave), asi que no hace falta otro paquete.
 */
@Injectable()
export class ResendMailSource implements MailSupport.ConfigSource {
  constructor(private readonly settings: SettingsService) {}

  async current(): Promise<MailSupport.Connection | null> {
    const apiKey = await this.settings.get('mail.resendApiKey');
    if (!apiKey) return null;

    const address = await this.settings.get('mail.fromAddress');
    const name = await this.settings.get('mail.fromName');
    return {
      host: 'smtp.resend.com',
      port: 465,
      user: 'resend',
      password: apiKey,
      from: address ? (name ? `${name} <${address}>` : address) : undefined,
    };
  }
}
