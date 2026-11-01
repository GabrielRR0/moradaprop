import { Injectable } from '@nestjs/common';
import { FieldCipher } from '../services/field-cipher.service';

type TemplateRow = { id: string; title?: string | null; body?: string | null };

/**
 * Vault de ReplyTemplate: el titulo y el texto de cada respuesta guardada van cifrados y ligados a SU fila
 * (el id va como dato autenticado), igual que los mensajes. Al crear una hay que darle su id desde el principio.
 */
@Injectable()
export class ReplyTemplateVault {
  constructor(private readonly cipher: FieldCipher) {}

  encode<T extends TemplateRow>(data: T): T {
    return {
      ...data,
      ...(typeof data.title === 'string' ? { title: this.cipher.encrypt('ReplyTemplate.title', data.title, data.id) } : {}),
      ...(typeof data.body === 'string' ? { body: this.cipher.encrypt('ReplyTemplate.body', data.body, data.id) } : {}),
    };
  }

  decode<T extends TemplateRow>(row: T): T {
    return {
      ...row,
      ...(typeof row.title === 'string' ? { title: this.cipher.decrypt('ReplyTemplate.title', row.title, row.id) } : {}),
      ...(typeof row.body === 'string' ? { body: this.cipher.decrypt('ReplyTemplate.body', row.body, row.id) } : {}),
    };
  }
}
