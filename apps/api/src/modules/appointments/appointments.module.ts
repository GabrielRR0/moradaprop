import { Module } from '@nestjs/common';
import { SecurityModule } from '../security';
import { PropertiesModule } from '../properties';
import { AppointmentsController } from './appointments.controller';
import { AppointmentPolicy } from './services/appointment.policy';
import { AppointmentCreateService } from './services/appointment-create.service';
import { AppointmentManageService } from './services/appointment-manage.service';
import { AppointmentsService } from './services/appointments.service';

@Module({
  imports: [PropertiesModule, SecurityModule],
  controllers: [AppointmentsController],
  providers: [AppointmentsService, AppointmentCreateService, AppointmentManageService, AppointmentPolicy],
  exports: [AppointmentsService],
})
export class AppointmentsModule {}
