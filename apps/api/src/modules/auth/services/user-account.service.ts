import { Injectable } from '@nestjs/common';
import type { User } from '@prisma/client';
import { PrismaService } from '../../../common/prisma';
import { UserVault } from '../../security';

/**
 * Unica puerta para buscar usuarios por correo o id dentro de auth: en la DB el correo y el nombre
 * estan cifrados, asi que se busca por emailHash y se devuelve el usuario ya descifrado.
 */
@Injectable()
export class UserAccountService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly vault: UserVault,
  ) {}

  /** Usuario por correo (ya normalizado) o null. */
  async findByEmail(email: string): Promise<User | null> {
    const row = await this.prisma.user.findUnique({ where: { emailHash: this.vault.emailHash(email) } });
    return this.vault.decode(row);
  }

  async findById(id: string): Promise<User | null> {
    return this.vault.decode(await this.prisma.user.findUnique({ where: { id } }));
  }

  async findByIdOrThrow(id: string): Promise<User> {
    return this.vault.decode(await this.prisma.user.findUniqueOrThrow({ where: { id } }));
  }
}
