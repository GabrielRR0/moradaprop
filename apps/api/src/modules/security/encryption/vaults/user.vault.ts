import { Injectable } from '@nestjs/common';
import { BlindIndexService } from '../services/blind-index.service';
import { FieldCipher } from '../services/field-cipher.service';

export interface UserPersonalData {
  email: string;
  name: string;
  phone?: string | null;
}

interface PersonRow {
  email?: string | null;
  name?: string | null;
  phone?: string | null;
}

/**
 * Vault de User (uno por entidad en esta carpeta): conoce los campos de User y usa el nucleo
 * generico (FieldCipher, BlindIndexService), que no sabe nada de modelos.
 * Datos personales de User: cifra para guardar, descifra para usar y arma lo necesario para buscar.
 * En la DB `email`, `name` y `phone` son siempre texto cifrado; `emailHash` y `searchTokens` permiten buscar.
 */
@Injectable()
export class UserVault {
  constructor(
    private readonly cipher: FieldCipher,
    private readonly index: BlindIndexService,
  ) {}

  /** Hash para buscar por correo exacto (login, registro, recuperacion). */
  emailHash(email: string): string {
    return this.index.hash('User.email', email, 'email');
  }

  /** Valores listos para `data:` de Prisma. Pasar siempre correo y nombre juntos: los tokens dependen de ambos. */
  encode(input: UserPersonalData) {
    return {
      email: this.cipher.encrypt('User.email', input.email),
      emailHash: this.emailHash(input.email),
      name: this.cipher.encrypt('User.name', input.name),
      ...(input.phone === undefined
        ? {}
        : { phone: input.phone === null ? null : this.cipher.encrypt('User.phone', input.phone) }),
      searchTokens: this.index.searchTokens('User.search', input.name, input.email),
    };
  }

  /** Filtro Prisma para el buscador del admin (nombre o correo, parcial). undefined si no hay texto. */
  searchWhere(query: string | undefined) {
    const tokens = query ? this.index.queryTokens('User.search', query) : [];
    return tokens.length ? { searchTokens: { hasEvery: tokens } } : undefined;
  }

  /** Descifra email, name y phone de una fila de usuario (o de una relacion a usuario). */
  decode<T extends PersonRow>(row: T): T;
  decode<T extends PersonRow>(row: T | null): T | null;
  decode<T extends PersonRow>(row: T | null): T | null {
    if (!row) return row;
    const out: PersonRow = { ...row };
    if (typeof row.email === 'string') out.email = this.cipher.decrypt('User.email', row.email);
    if (typeof row.name === 'string') out.name = this.cipher.decrypt('User.name', row.name);
    if (typeof row.phone === 'string') out.phone = this.cipher.decrypt('User.phone', row.phone);
    return out as T;
  }
}
