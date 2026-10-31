import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/common/prisma';
import { UserVault } from '@/modules/security';
import { MailSupport } from '@/support/mail';
import type { MailTestResource } from '../contracts/resources';

/** Manda un correo de prueba al propio admin para comprobar que la configuracion de correo funciona. */
@Injectable()
export class MailTestService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly vault: UserVault,
    private readonly mail: MailSupport.Service,
  ) {}

  async send(adminId: string): Promise<MailTestResource> {
    const admin = await this.prisma.user.findUniqueOrThrow({ where: { id: adminId } });
    const { email } = this.vault.decode(admin);
    try {
      await this.mail.sendOrThrow(email, { name: 'test-email' });
      return { ok: true, to: email, error: null };
    } catch (error) {
      return { ok: false, to: email, error: (error as Error).message.slice(0, 200) };
    }
  }
}
