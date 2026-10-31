import { Module } from '@nestjs/common';
import { PropertiesModule } from '@/modules/properties';
import { SecurityModule } from '@/modules/security';
import { ReceivedAppointmentsController } from './controllers/private/publisher/received-appointments.controller';
import { AppointmentsController } from './controllers/private/user/appointments.controller';
import { AppointmentPolicy } from './services/access/appointment.policy';
import { AppointmentsService } from './services/appointments.service';
import { AppointmentClientService } from './services/booking/appointment-client.service';
import { AppointmentCreateService } from './services/booking/appointment-create.service';
import { AppointmentLeadsService } from './services/leads/appointment-leads.service';
import { AppointmentReaderService } from './services/reader/appointment-reader.service';

@Module({
  imports: [PropertiesModule, SecurityModule],
  // Rutas fijas (mine, received) y ":id/..." en controllers distintos: no se pisan.
  controllers: [AppointmentsController, ReceivedAppointmentsController],
  providers: [
    AppointmentsService,
    // booking/: lo que hace el cliente
    AppointmentCreateService,
    AppointmentClientService,
    // leads/: lo que hace quien gestiona la propiedad
    AppointmentLeadsService,
    AppointmentReaderService,
    AppointmentPolicy,
  ],
  exports: [AppointmentsService],
})
export class AppointmentsModule {}
