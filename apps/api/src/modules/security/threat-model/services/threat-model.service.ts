import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
  OnModuleInit,
  ServiceUnavailableException,
} from '@nestjs/common';
import { AppConfig } from '@/config';
import { STRIDE_NAMES, type FileCheck, type FileFacts, type ResponseFacts, type ThreatMode, type ThreatShield, type ThreatSubject } from '../types';
import { ThreatLedgerService } from './threat-ledger.service';
import { ThreatResponseService } from './threat-response.service';

export const THREAT_SHIELDS = Symbol('THREAT_SHIELDS');
export const THREAT_FILE_CHECKS = Symbol('THREAT_FILE_CHECKS');

/** Fachada del modelo de amenazas: lo unico que otros modulos usan. */
@Injectable()
export class ThreatModelService implements OnModuleInit {
  private readonly logger = new Logger(ThreatModelService.name);

  constructor(
    private readonly config: AppConfig,
    private readonly ledger: ThreatLedgerService,
    private readonly response: ThreatResponseService,
    @Inject(THREAT_SHIELDS) private readonly shields: readonly ThreatShield[],
    @Inject(THREAT_FILE_CHECKS) private readonly fileChecks: readonly FileCheck[],
  ) {}

  get mode(): ThreatMode {
    return this.config.security.threatMode;
  }

  onModuleInit() {
    if (this.config.app.isProduction && this.mode !== 'enforce') {
      this.logger.warn(`THREAT_MODE=${this.mode}: en produccion usa "enforce" para que los ataques se bloqueen solos`);
    }
  }

  /** Mira una respuesta ya enviada y la cuenta en los escudos que la reconocen. */
  async observe(facts: ResponseFacts): Promise<void> {
    if (this.mode === 'off') return;
    for (const shield of this.shields) {
      if (shield.matches?.(facts)) await this.count(shield, facts);
    }
  }

  /** Para que un service reporte un hecho propio a un escudo (ej. 'malicious-upload'). */
  async report(shieldId: string, subject: ThreatSubject): Promise<void> {
    if (this.mode === 'off') return;
    const shield = this.shields.find((s) => s.id === shieldId);
    if (!shield) {
      this.logger.warn(`Escudo desconocido: ${shieldId}`);
      return;
    }
    await this.count(shield, subject);
  }

  /**
   * Revisa archivos subidos ANTES de guardarlos. Si alguno no pasa: se audita, se cuenta en el escudo
   * 'malicious-upload' y se responde 400 generico (no se dice cual revision lo detuvo).
   * Si una revision falla al ejecutarse (error inesperado) se rechaza con 503: nunca se deja pasar sin revisar.
   */
  async inspectFiles(files: FileFacts[], subject: ThreatSubject): Promise<void> {
    if (this.mode === 'off') return;
    for (const file of files) {
      for (const check of this.fileChecks) {
        let reason: string | null;
        try {
          reason = await check.inspect(file);
        } catch (error) {
          this.logger.error(`Revision "${check.id}" no disponible: ${(error as Error).message}`);
          throw new ServiceUnavailableException('No pudimos verificar el archivo, intenta de nuevo mas tarde');
        }
        if (reason) {
          await this.response.fileRejected(check, reason, file, subject);
          await this.report('malicious-upload', subject);
          throw new BadRequestException('El archivo fue rechazado por seguridad');
        }
      }
    }
  }

  /** Mapa del modelo para el panel admin: modo, escudos y revisiones de archivos. */
  describe() {
    return {
      mode: this.mode,
      shields: this.shields.map(({ matches: _matches, ...shield }) => ({ ...shield, strideName: STRIDE_NAMES[shield.stride] })),
      fileChecks: this.fileChecks.map(({ inspect: _inspect, ...check }) => ({ ...check, strideName: STRIDE_NAMES[check.stride] })),
    };
  }

  private async count(shield: ThreatShield, subject: ThreatSubject): Promise<void> {
    const who = subject.userId ?? subject.ip;
    if (!who) return;
    const key = `${shield.id}:${who}`;
    const total = this.ledger.hit(key, shield.windowSec);
    if (total < shield.limit) return;

    this.ledger.clear(key); // se actua una vez por rafaga, no en cada peticion siguiente
    await this.response.act(shield, subject, total, this.mode);
  }
}
