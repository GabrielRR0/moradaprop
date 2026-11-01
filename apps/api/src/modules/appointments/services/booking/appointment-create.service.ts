import { randomUUID } from 'node:crypto';
import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { AppConfig } from '@/config';
import { MailSupport } from '@/support/mail';
import { PrismaService } from '@/common/prisma';
import type { AuthUserContext, RequestContext } from '@/common/security/types';
import { AuditService } from '@/modules/audit';
import { AppointmentMessageVault, AppointmentVault, UserVault } from '@/modules/security';
import { PropertyPolicyService } from '@/modules/properties';
import type { CreateAppointmentDto } from '../../contracts/dto/create-appointment.dto';
import type { AppointmentClientResource } from '../../contracts/resources';
import { assertVisitDate } from '../../utils/conversation';
import { AppointmentReaderService } from '../reader/appointment-reader.service';

const MAX_PENDING_PER_USER = 10;
/** Como se nombra cada tipo en el correo al anunciante. */
const KIND_LABEL: Record<CreateAppointmentDto['type'], string> = { VISITA: 'visita', RESERVA: 'apartado', INTERES: 'interes', PREGUNTA: 'pregunta' };

@Injectable()
export class AppointmentCreateService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly policy: PropertyPolicyService,
    private readonly mail: MailSupport.Service,
    private readonly audit: AuditService,
    private readonly config: AppConfig,
    private readonly vault: UserVault,
    private readonly appointmentVault: AppointmentVault,
    private readonly messageVault: AppointmentMessageVault,
    private readonly reader: AppointmentReaderService,
  ) {}

  /** El solicitante sale del token. Crea el lead y avisa por correo a quien gestiona la propiedad. */
  async create(user: AuthUserContext, dto: CreateAppointmentDto, context: RequestContext): Promise<AppointmentClientResource> {
    const property = await this.prisma.property.findUnique({
      where: { id: dto.propertyId },
      include: { owner: { select: { email: true } }, assignedAgent: { select: { email: true } } },
    });
    if (!property) throw new NotFoundException('Propiedad no encontrada');

    // Una reserva solo se pide sobre una propiedad libre; lo demas tambien sobre la reservada.
    const allowed = dto.type === 'RESERVA' ? ['PUBLICADA'] : ['PUBLICADA', 'RESERVADA'];
    if (!allowed.includes(property.status)) {
      throw new BadRequestException('Esta propiedad no admite esa solicitud en este momento');
    }
    // Reservada del todo: quien la gestiona ya no quiere recibir mas citas.
    if (!property.acceptsVisits) throw new BadRequestException('Esta propiedad esta reservada y ya no recibe solicitudes');
    if (dto.type === 'PREGUNTA' && !dto.message) throw new BadRequestException('Escribe tu pregunta');
    if (await this.policy.canManage(user, property)) {
      throw new ForbiddenException('No puedes solicitar una cita en tu propia propiedad');
    }

    const scheduledAt = this.parseSchedule(dto);
    const client = this.vault.decode(await this.prisma.user.findUniqueOrThrow({ where: { id: user.id } }));
    const contactName = dto.contactName ?? client.name;
    const contactPhone = dto.contactPhone ?? client.phone ?? undefined;
    const channel = dto.preferredChannel ?? 'WHATSAPP';
    if (channel !== 'EMAIL' && !contactPhone) {
      throw new BadRequestException('Indica un telefono de contacto para que te escriban por WhatsApp o llamada');
    }

    await this.assertNoSpam(user.id, property.id, dto.type);

    const created = await this.prisma.appointment.create({
      data: this.appointmentVault.encode({
        propertyId: property.id,
        clientId: user.id,
        type: dto.type,
        scheduledAt,
        message: dto.message,
        contactName,
        contactPhone,
        preferredChannel: channel,
        clientSeenAt: new Date(),
        // El primer mensaje abre la conversacion.
        ...(dto.message ? { messages: { create: this.messageVault.encode({ id: randomUUID(), authorId: user.id, body: dto.message }) } } : {}),
      }),
    });

    // Aviso a quien gestiona la propiedad (dueno y/o agente asignado).
    const recipients = new Set([this.vault.decode(property.owner).email, property.assignedAgent && this.vault.decode(property.assignedAgent).email].filter(Boolean) as string[]);
    await Promise.all(
      [...recipients].map((email) =>
        this.mail.send(email, {
          name: 'appointment-new',
          propertyTitle: property.title,
          kind: KIND_LABEL[dto.type],
          clientName: contactName,
          link: `${this.config.app.frontendUrl}/mensajes/${created.id}`,
        }),
      ),
    );
    await this.audit.log({
      action: 'appointments.created',
      userId: user.id,
      resource: 'Appointment',
      resourceId: created.id,
      ip: context.ip,
      userAgent: context.userAgent,
      metadata: { propertyId: property.id, type: dto.type },
    });
    // Se vuelve a leer ya descifrado (contacto y mensajes viajan cifrados en la base).
    return this.reader.asClient(created.id);
  }

  /** La fecha es opcional (el cliente ya no la elige: el anunciante propone fechas y el cliente acepta una); si viene, debe ser valida. */
  private parseSchedule(dto: CreateAppointmentDto): Date | undefined {
    if (!dto.scheduledAt || dto.type !== 'VISITA') return undefined;
    const date = new Date(dto.scheduledAt);
    assertVisitDate(date);
    return date;
  }

  /** Evita duplicados (misma propiedad y tipo) y el abuso de solicitudes sin cerrar. */
  private async assertNoSpam(userId: string, propertyId: string, type: CreateAppointmentDto['type']) {
    const pending = await this.prisma.appointment.findMany({
      where: { clientId: userId, status: { in: ['PENDIENTE', 'ABIERTA'] } },
      select: { propertyId: true, type: true },
    });
    if (pending.some((p) => p.propertyId === propertyId && p.type === type)) {
      throw new ConflictException('Ya tienes una solicitud pendiente igual para esta propiedad');
    }
    if (pending.length >= MAX_PENDING_PER_USER) {
      throw new ConflictException(`Tienes demasiadas solicitudes pendientes (maximo ${MAX_PENDING_PER_USER})`);
    }
  }
}
