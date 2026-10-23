import type { Routes } from '@nestjs/core';
import { AppointmentsModule } from '../modules/appointments';

export const appointmentsRoutes: Routes = [{ path: 'appointments', module: AppointmentsModule }];
