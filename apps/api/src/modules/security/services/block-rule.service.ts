import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { BlockType } from '@prisma/client';
import { isIP } from 'node:net';
import { PrismaService } from '../../../common/prisma';
import type { CreateBlockRuleDto } from '../dto/create-block-rule.dto';
import { isValidCidr, normalizeIp } from '../utils/cidr';
import { BlockCheckService } from './block-check.service';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DOMAIN = /^(?!-)[a-z0-9-]+(\.[a-z0-9-]+)+$/i;

/** CRUD de reglas de bloqueo (lo usa el panel admin). */
@Injectable()
export class BlockRuleService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly check: BlockCheckService,
  ) {}

  list() {
    return this.prisma.blockRule.findMany({ orderBy: { createdAt: 'desc' }, take: 500 });
  }

  async create(dto: CreateBlockRuleDto, createdBy: string) {
    const value = this.normalize(dto.type, dto.value);
    const exists = await this.prisma.blockRule.findUnique({
      where: { type_value: { type: dto.type, value } },
    });
    if (exists) throw new ConflictException('Ya existe un bloqueo igual');

    const rule = await this.prisma.blockRule.create({
      data: {
        type: dto.type,
        value,
        reason: dto.reason,
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
        createdBy,
      },
    });
    this.check.invalidate();
    return rule;
  }

  /** Bloqueo de un usuario por su id. Si ya estaba bloqueado no hace nada (se puede llamar varias veces). */
  async blockUser(userId: string, reason: string, createdBy: string) {
    await this.prisma.blockRule.upsert({
      where: { type_value: { type: BlockType.USER, value: userId } },
      create: { type: BlockType.USER, value: userId, reason, createdBy },
      update: {},
    });
    this.check.invalidate();
  }

  async unblockUser(userId: string) {
    await this.prisma.blockRule.deleteMany({ where: { type: BlockType.USER, value: userId } });
    this.check.invalidate();
  }

  async remove(id: string) {
    const rule = await this.prisma.blockRule.findUnique({ where: { id } });
    if (!rule) throw new NotFoundException('Bloqueo no encontrado');
    await this.prisma.blockRule.delete({ where: { id } });
    this.check.invalidate();
    return rule;
  }

  /** Valida y normaliza el valor segun el tipo de bloqueo. */
  private normalize(type: BlockType, raw: string): string {
    const value = raw.trim();
    const invalid = (what: string) => new BadRequestException(`Valor invalido para ${what}`);

    switch (type) {
      case BlockType.IP:
        if (!isIP(normalizeIp(value))) throw invalid('una IP');
        return normalizeIp(value);
      case BlockType.CIDR:
        if (!isValidCidr(value)) throw invalid('un CIDR (ej. 192.168.0.0/24)');
        return value;
      case BlockType.COUNTRY:
        if (!/^[A-Za-z]{2}$/.test(value)) throw invalid('un pais (codigo de 2 letras, ej. VE)');
        return value.toUpperCase();
      case BlockType.USER:
        if (!UUID.test(value)) throw invalid('un usuario (UUID)');
        return value.toLowerCase();
      case BlockType.EMAIL:
        if (!EMAIL.test(value)) throw invalid('un correo');
        return value.toLowerCase();
      case BlockType.EMAIL_DOMAIN:
        if (!DOMAIN.test(value)) throw invalid('un dominio (ej. correo-basura.com)');
        return value.toLowerCase();
    }
  }
}
