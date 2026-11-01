import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/common/prisma';
import { AppConfig } from '@/config';
import { UserVault } from '@/modules/security';
import { MailSupport } from '@/support/mail';

export type ConversationEvent = 'message' | 'proposal' | 'accepted';

/** Avisa por correo que hay novedades en una conversacion. El correo no incluye el texto del mensaje, solo el enlace. */
@Injectable()
export class AppointmentNotifier {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mail: MailSupport.Service,
    private readonly config: AppConfig,
    private readonly vault: UserVault,
  ) {}

  /** Al cliente que pidio la cita. */
  async toClient(appointmentId: string, event: ConversationEvent): Promise<void> {
    const row = await this.prisma.appointment.findUnique({ where: { id: appointmentId }, include: { client: true, property: { select: { title: true } } } });
    if (row) await this.send([this.vault.decode(row.client).email], row.property.title, appointmentId, event);
  }

  /** A quien gestiona la propiedad: el dueno y el agente asignado, si lo hay. */
  async toManagers(appointmentId: string, event: ConversationEvent): Promise<void> {
    const row = await this.prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: { property: { select: { title: true, owner: true, assignedAgent: true } } },
    });
    if (!row) return;
    const emails = [row.property.owner, row.property.assignedAgent].filter((user) => user !== null).map((user) => this.vault.decode(user).email);
    await this.send([...new Set(emails)], row.property.title, appointmentId, event);
  }

  // Se espera el envio (MailSupport.Service ya traga sus errores). Con la cola de trabajos pasara a ser un job.
  private async send(emails: string[], propertyTitle: string, appointmentId: string, event: ConversationEvent): Promise<void> {
    const link = `${this.config.app.frontendUrl}/mensajes/${appointmentId}`;
    await Promise.all(emails.map((email) => this.mail.send(email, { name: 'appointment-message', propertyTitle, event, link })));
  }
}
