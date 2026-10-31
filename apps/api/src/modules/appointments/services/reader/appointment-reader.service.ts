import { Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '@/common/prisma';
import { STORAGE_PROVIDER, type StorageProvider } from '@/common/storage';
import { AppointmentVault, UserVault } from '@/modules/security';
import { DbSupport } from '@/support/db';
import type { ListAppointmentsDto } from '../../contracts/dto/list-appointments.dto';
import type {
  AppointmentClientListResource,
  AppointmentClientResource,
  AppointmentLeadListResource,
  AppointmentLeadResource,
} from '../../contracts/resources';
import { appointmentInclude, toClientView, toLeadView } from '../../utils/appointment-mapper';

type AppointmentRow = DbSupport.Prisma.AppointmentGetPayload<{ include: typeof appointmentInclude }>;
type ToView<T> = (row: AppointmentRow, storage: StorageProvider) => T;

/** Lee citas y las deja listas para responder, ya descifradas, como las ve el cliente o quien las gestiona. */
@Injectable()
export class AppointmentReaderService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly vault: UserVault,
    private readonly appointmentVault: AppointmentVault,
    @Inject(STORAGE_PROVIDER) private readonly storage: StorageProvider,
  ) {}

  /** Una pagina de solicitudes vistas por el CLIENTE. */
  clientPage(where: DbSupport.Prisma.AppointmentWhereInput, query: ListAppointmentsDto): Promise<AppointmentClientListResource> {
    return this.page(where, query, toClientView);
  }

  /** Una pagina de leads vistos por QUIEN GESTIONA. */
  leadPage(where: DbSupport.Prisma.AppointmentWhereInput, query: ListAppointmentsDto): Promise<AppointmentLeadListResource> {
    return this.page(where, query, toLeadView);
  }

  asClient(id: string): Promise<AppointmentClientResource> {
    return this.reload(id, toClientView);
  }

  asLead(id: string): Promise<AppointmentLeadResource> {
    return this.reload(id, toLeadView);
  }

  private async page<T>(
    where: DbSupport.Prisma.AppointmentWhereInput,
    query: ListAppointmentsDto,
    toView: ToView<T>,
  ): Promise<{ items: T[]; total: number; page: number; limit: number }> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.appointment.findMany({ where, include: appointmentInclude, orderBy: { createdAt: 'desc' }, skip: (page - 1) * limit, take: limit }),
      this.prisma.appointment.count({ where }),
    ]);
    return { items: rows.map((row) => toView(this.decode(row), this.storage)), total, page, limit };
  }

  private async reload<T>(id: string, toView: ToView<T>): Promise<T> {
    const row = await this.prisma.appointment.findUniqueOrThrow({ where: { id }, include: appointmentInclude });
    return toView(this.decode(row), this.storage);
  }

  private decode(row: AppointmentRow): AppointmentRow {
    return { ...this.appointmentVault.decode(row), client: this.vault.decode(row.client) };
  }
}
