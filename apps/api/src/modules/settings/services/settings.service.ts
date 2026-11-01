import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/common/prisma';
import type { RequestContext } from '@/common/security/types';
import { AuditService } from '@/modules/audit';
import { FieldCipher } from '@/modules/security';
import type { SettingResource } from '../contracts/resources';
import { isSettingKey, SETTING_KEYS, type SettingKey } from '../registry/setting-keys';

const CACHE_MS = 30_000;

type Row = { key: string; value: string; secret: boolean; updatedAt: Date };

/** "re_••••a1b2": lo justo para reconocer cual clave es sin poder usarla. */
export const maskSecret = (value: string): string => (value.length <= 8 ? '••••' : `${value.slice(0, 3)}••••${value.slice(-4)}`);

/**
 * Ajustes de la plataforma que el admin cambia sin tocar variables de entorno. TODOS se guardan cifrados en la base
 * (AES-256-GCM, con la clave de cifrado del servidor) y solo se descifran aqui; `secret` solo decide si el valor se muestra
 * (un secreto sale enmascarado y nunca completo).
 */
@Injectable()
export class SettingsService {
  private cache: { at: number; rows: Map<string, Row> } | null = null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly cipher: FieldCipher,
    private readonly audit: AuditService,
  ) {}

  /** El valor ya descifrado, o undefined si no se guardo. Es lo que usa el codigo; nunca se devuelve por la API. */
  async get(key: SettingKey): Promise<string | undefined> {
    const row = (await this.rows()).get(key);
    if (!row) return undefined;
    return this.plainOf(key, row);
  }

  async list(): Promise<SettingResource[]> {
    const rows = await this.rows();
    return (Object.keys(SETTING_KEYS) as SettingKey[]).map((key) => this.toResource(key, rows.get(key)));
  }

  async set(keyName: string, value: string, adminId: string, context: RequestContext): Promise<SettingResource> {
    const key = this.assertKey(keyName);
    const clean = value.trim();
    const problem = SETTING_KEYS[key].validate(clean);
    if (problem) throw new BadRequestException(problem);

    const secret = SETTING_KEYS[key].secret;
    const stored = this.cipher.encrypt(this.field(key), clean);
    await this.prisma.platformSetting.upsert({
      where: { key },
      create: { key, value: stored, secret, updatedBy: adminId },
      update: { value: stored, secret, updatedBy: adminId },
    });
    this.cache = null;
    // Se audita QUE clave cambio, nunca el valor.
    await this.audit.log({ action: 'settings.update', userId: adminId, resource: 'PlatformSetting', resourceId: key, ip: context.ip, userAgent: context.userAgent });
    return this.toResource(key, (await this.rows()).get(key));
  }

  async remove(keyName: string, adminId: string, context: RequestContext): Promise<SettingResource> {
    const key = this.assertKey(keyName);
    await this.prisma.platformSetting.deleteMany({ where: { key } });
    this.cache = null;
    await this.audit.log({ action: 'settings.remove', userId: adminId, resource: 'PlatformSetting', resourceId: key, ip: context.ip, userAgent: context.userAgent });
    return this.toResource(key, undefined);
  }

  private assertKey(key: string): SettingKey {
    if (!isSettingKey(key)) throw new NotFoundException('Ajuste desconocido');
    return key;
  }

  /** El valor descifrado. Un ajuste no secreto guardado antes de que se cifrara todo (en claro) se sigue leyendo bien. */
  private plainOf(key: SettingKey, row: Row): string {
    return row.secret ? this.cipher.decrypt(this.field(key), row.value) : this.cipher.decryptOrPlain(this.field(key), row.value);
  }

  /** Va como contexto del cifrado: un valor copiado a otra clave no descifra. */
  private field(key: SettingKey) {
    return `PlatformSetting.${key}` as const;
  }

  private toResource(key: SettingKey, row: Row | undefined): SettingResource {
    const { label, secret } = SETTING_KEYS[key];
    const plain = row ? this.plainOf(key, row) : null;
    return {
      key,
      label,
      secret,
      configured: Boolean(row),
      value: secret ? null : plain,
      preview: secret && plain ? maskSecret(plain) : null,
      updatedAt: row ? row.updatedAt.toISOString() : null,
    };
  }

  /** Toda la tabla es pequeña: se lee junta y se guarda en memoria unos segundos. */
  private async rows(): Promise<Map<string, Row>> {
    if (this.cache && Date.now() - this.cache.at < CACHE_MS) return this.cache.rows;
    const found = await this.prisma.platformSetting.findMany({ select: { key: true, value: true, secret: true, updatedAt: true } });
    this.cache = { at: Date.now(), rows: new Map(found.map((row) => [row.key, row])) };
    return this.cache.rows;
  }
}
