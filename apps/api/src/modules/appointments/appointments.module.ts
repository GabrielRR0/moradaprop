import { Module } from '@nestjs/common';
import { PropertiesModule } from '@/modules/properties';
import { SecurityModule } from '@/modules/security';
import { ReceivedAppointmentsController } from './controllers/private/publisher/received-appointments.controller';
import { AppointmentThreadController } from './controllers/private/user/appointment-thread.controller';
import { AppointmentsController } from './controllers/private/user/appointments.controller';
import { AppointmentPolicy } from './services/access/appointment.policy';
import { AppointmentsService } from './services/appointments.service';
import { AppointmentClientService } from './services/booking/appointment-client.service';
import { AppointmentCreateService } from './services/booking/appointment-create.service';
import { AppointmentLeadsService } from './services/leads/appointment-leads.service';
import { AppointmentNotifier } from './services/notify/appointment-notifier.service';
import { AppointmentReaderService } from './services/reader/appointment-reader.service';
import { AppointmentConversationService } from './services/thread/appointment-conversation.service';
import { AppointmentThreadReaderService } from './services/thread/appointment-thread-reader.service';

@Module({
  imports: [PropertiesModule, SecurityModule],
  // Rutas fijas (mine, received) antes que ":id": el controller con GET :id (la conversacion) va ULTIMO.
  controllers: [ReceivedAppointmentsController, AppointmentsController, AppointmentThreadController],
  providers: [
    AppointmentsService,
    // booking/: lo que hace el cliente
    AppointmentCreateService,
    AppointmentClientService,
    // leads/: lo que hace quien gestiona la propiedad
    AppointmentLeadsService,
    // thread/: la conversacion (leerla y escribir en ella)
    AppointmentThreadReaderService,
    AppointmentConversationService,
    // notify/: avisos por correo
    AppointmentNotifier,
    AppointmentReaderService,
    AppointmentPolicy,
  ],
  exports: [AppointmentsService],
})
export class AppointmentsModule {}
