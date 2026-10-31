import { Global, Module } from '@nestjs/common';
import { MailSupport } from '@/support/mail';
import { SecurityModule } from '@/modules/security';
import { SettingsController } from './controllers/private/admin/settings.controller';
import { MailTestService } from './services/mail-test.service';
import { ResendMailSource } from './services/resend-mail-source.service';
import { SettingsService } from './services/settings.service';

/** Global: el correo (support/mail) busca aqui su configuracion sin depender de este modulo. */
@Global()
@Module({
  imports: [SecurityModule],
  controllers: [SettingsController],
  providers: [SettingsService, MailTestService, ResendMailSource, { provide: MailSupport.ConfigSourceToken, useExisting: ResendMailSource }],
  exports: [SettingsService, MailSupport.ConfigSourceToken],
})
export class SettingsModule {}
