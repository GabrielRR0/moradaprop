import { Injectable } from '@nestjs/common';
import { FieldCipher } from '../services/field-cipher.service';

type AppointmentText = {
  contactName?: string | null;
  contactPhone?: string | null;
  message?: string | null;
  responseNote?: string | null;
};

const FIELDS = ['contactName', 'contactPhone', 'message', 'responseNote'] as const;

/** Vault de Appointment: contacto del solicitante y los mensajes de la cita van cifrados. */
@Injectable()
export class AppointmentVault {
  constructor(private readonly cipher: FieldCipher) {}

  encode<T extends AppointmentText>(data: T): T {
    return this.cipher.encryptFields('Appointment', data, FIELDS);
  }

  decode<T extends AppointmentText>(row: T): T {
    return this.cipher.decryptFields('Appointment', row, FIELDS);
  }
}
