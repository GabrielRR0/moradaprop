import { Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '@/common/prisma';
import type { AuthUserContext, RequestContext } from '@/common/security/types';
import { STORAGE_PROVIDER, type StorageProvider } from '@/common/storage';
import { AppointmentMessageVault, AppointmentVault, OwnershipService, UserVault } from '@/modules/security';
import type { AppointmentThreadResource } from '../../contracts/resources';
import { sideOf, type Side } from '../../utils/conversation';
import { threadInclude, toThread } from '../../utils/thread-mapper';
import { AppointmentPolicy } from '../access/appointment.policy';

/** Lee la conversacion de una solicitud ya descifrada, como la ve el cliente o quien gestiona la propiedad. */
@Injectable()
export class AppointmentThreadReaderService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: AppointmentPolicy,
    private readonly ownership: OwnershipService,
    private readonly vault: UserVault,
    private readonly appointmentVault: AppointmentVault,
    private readonly messageVault: AppointmentMessageVault,
    @Inject(STORAGE_PROVIDER) private readonly storage: StorageProvider,
  ) {}

  /** Abre la conversacion y la marca como vista por quien la abre (apaga el aviso de "nuevo"). */
  async open(user: AuthUserContext, id: string, context: RequestContext): Promise<AppointmentThreadResource> {
    const appointment = await this.ownership.require(this.access, user, id, 'view', context);
    const side = sideOf(user, appointment);
    await this.prisma.appointment.updateMany({
      where: { id },
      data: side === 'client' ? { clientSeenAt: new Date() } : { managerSeenAt: new Date() },
    });
    return this.build(id, side);
  }

  /** La conversacion tal como esta ahora (los servicios de escritura la devuelven al terminar). */
  async build(id: string, side: Side): Promise<AppointmentThreadResource> {
    const row = await this.prisma.appointment.findUniqueOrThrow({ where: { id }, include: threadInclude });
    const decoded = {
      ...this.appointmentVault.decode(row),
      client: this.vault.decode(row.client),
      property: { ...row.property, owner: this.vault.decode(row.property.owner) },
      messages: row.messages.map((message) => this.messageVault.decode(message)),
    };
    return toThread(decoded, side, this.storage);
  }
}
