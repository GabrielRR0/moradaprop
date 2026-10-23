import { Module } from '@nestjs/common';
import { PropertiesModule } from '../properties';
import { AppointmentsController } from './appointments.controller';
import { AppointmentCreateService } from './services/appointment-create.service';
import { AppointmentManageService } from './services/appointment-manage.service';
import { AppointmentsService } from './services/appointments.service';

@Module({
  imports: [PropertiesModule],
  controllers: [AppointmentsController],
  providers: [AppointmentsService, AppointmentCreateService, AppointmentManageService],
  exports: [AppointmentsService],
})
export class AppointmentsModule {}
