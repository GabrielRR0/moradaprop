import { Injectable } from '@nestjs/common';
import { FieldCipher } from '../services/field-cipher.service';

type MessageRow = { id: string; body?: string | null };

/**
 * Vault de AppointmentMessage: el texto de cada mensaje va cifrado y ligado a SU fila (el id va como dato
 * autenticado). Un texto copiado a otro mensaje, aunque sea de la misma conversacion, no descifra.
 * Por eso al crear un mensaje hay que darle su id desde el principio (`randomUUID()`).
 */
@Injectable()
export class AppointmentMessageVault {
  constructor(private readonly cipher: FieldCipher) {}

  encode<T extends MessageRow>(data: T): T {
    return typeof data.body === 'string' ? { ...data, body: this.cipher.encrypt('AppointmentMessage.body', data.body, data.id) } : data;
  }

  decode<T extends MessageRow>(row: T): T {
    return typeof row.body === 'string' ? { ...row, body: this.cipher.decrypt('AppointmentMessage.body', row.body, row.id) } : row;
  }
}
