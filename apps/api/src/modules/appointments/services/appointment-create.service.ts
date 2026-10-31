import { BadRequestException, ConflictException, ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { AppConfig } from '../../../config';
import { MailSupport } from '../../../support/mail';
import { PrismaService } from '../../../common/prisma';
import type { AuthUserContext, RequestContext } from '../../../common/security/types';
import { STORAGE_PROVIDER, type StorageProvider } from '../../../common/storage';
import { AuditService } from '../../audit';
import { AppointmentVault, UserVault } from '../../security';
import { PropertyPolicyService } from '../../properties';
import type { CreateAppointmentDto } from '../dto/appointments.dto';
import { appointmentInclude, toClientView } from '../utils/appointment-mapper';

const MAX_DAYS_AHEAD = 90;
const MAX_PENDING_PER_USER = 10;

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
    @Inject(STORAGE_PROVIDER) private readonly storage: StorageProvider,
  ) {}

  /** El solicitante sale del token. Crea el lead y avisa por correo a quien gestiona la propiedad. */
  async create(user: AuthUserContext, dto: CreateAppointmentDto, context: RequestContext) {
    const property = await this.prisma.property.findUnique({
      where: { id: dto.propertyId },
      include: { owner: { select: { email: true } }, assignedAgent: { select: { email: true } } },
    });
    if (!property) throw new NotFoundException('Propiedad no encontrada');

    // Una reserva solo se pide sobre una propiedad libre; una visita tambien sobre la reservada.
    const allowed = dto.type === 'RESERVA' ? ['PUBLICADA'] : ['PUBLICADA', 'RESERVADA'];
    if (!allowed.includes(property.status)) {
      throw new BadRequestException('Esta propiedad no admite esa solicitud en este momento');
    }
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
      }),
      include: appointmentInclude,
    });

    // Aviso a quien gestiona la propiedad (dueno y/o agente asignado).
    const recipients = new Set([this.vault.decode(property.owner).email, property.assignedAgent && this.vault.decode(property.assignedAgent).email].filter(Boolean) as string[]);
    await Promise.all(
      [...recipients].map((email) =>
        this.mail.send(email, {
          name: 'appointment-new',
          propertyTitle: property.title,
          kind: dto.type === 'VISITA' ? 'visita' : 'apartado',
          clientName: contactName,
          link: `${this.config.app.frontendUrl}/dashboard/appointments/${created.id}`,
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
    return toClientView(this.appointmentVault.decode(created), this.storage);
  }

  /** VISITA exige una fecha futura (maximo 90 dias); RESERVA no lleva fecha. */
  private parseSchedule(dto: CreateAppointmentDto): Date | undefined {
    if (dto.type === 'RESERVA') return undefined;
    if (!dto.scheduledAt) throw new BadRequestException('Indica la fecha y hora de la visita');
    const date = new Date(dto.scheduledAt);
    const limit = Date.now() + MAX_DAYS_AHEAD * 24 * 60 * 60 * 1000;
    if (date.getTime() <= Date.now()) throw new BadRequestException('La fecha de la visita debe ser futura');
    if (date.getTime() > limit) throw new BadRequestException(`La visita debe ser dentro de los proximos ${MAX_DAYS_AHEAD} dias`);
    return date;
  }

  /** Evita duplicados (misma propiedad y tipo) y el abuso de solicitudes pendientes. */
  private async assertNoSpam(userId: string, propertyId: string, type: CreateAppointmentDto['type']) {
    const pending = await this.prisma.appointment.findMany({
      where: { clientId: userId, status: 'PENDIENTE' },
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
