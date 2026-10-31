import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';
import { AppConfig } from '@/config';
import type { CachePolicy } from './cache-policies';

const MAX_MEMORY_ENTRIES = 500;

interface MemoryEntry {
  value: string;
  expiresAt: number;
}

/**
 * Cache para respuestas costosas y muy repetidas (mapa, busquedas).
 *
 * Idea central ("un solo vuelo"): si 1.000 clientes piden lo mismo a la vez, solo UNO consulta la base;
 * los otros 999 esperan ese mismo resultado. Despues el resultado se guarda unos segundos.
 *
 * Con CACHE_DRIVER=redis se comparte entre todos los servidores; con "memory" vive en este proceso.
 * Si Redis falla, la app sigue funcionando (consulta la base directo): la cache nunca tumba el servicio.
 */
@Injectable()
export class CacheService implements OnModuleDestroy {
  private readonly logger = new Logger(CacheService.name);
  private readonly memory = new Map<string, MemoryEntry>();
  private readonly inFlight = new Map<string, Promise<unknown>>();
  private readonly redis?: Redis;

  constructor(private readonly config: AppConfig) {
    if (config.cache.driver === 'redis') {
      this.redis = new Redis(config.database.redisUrl, { maxRetriesPerRequest: 1, commandTimeout: 300 });
      // Sin este listener un error de conexion tumbaria el proceso.
      this.redis.on('error', (error) => this.logger.warn(`Redis: ${error.message}`));
    }
  }

  /** CACHE_TTL_SECONDS=0 apaga toda la cache (se usa en los tests y para depurar). */
  get enabled(): boolean {
    return this.config.cache.ttlSeconds > 0;
  }

  /**
   * Devuelve el valor guardado para `key` o lo calcula con `compute` y lo guarda.
   * `policy` (ver cache-policies.ts) decide cuanto dura; sin ella se usa CACHE_TTL_SECONDS.
   * El valor debe poder convertirse a JSON.
   */
  async remember<T>(key: string, compute: () => Promise<T>, policy?: CachePolicy): Promise<T> {
    if (!this.enabled) return compute();

    const cached = await this.read(key);
    if (cached !== undefined) return JSON.parse(cached) as T;

    // Ya hay alguien calculando lo mismo: se espera su resultado en vez de repetir la consulta.
    const running = this.inFlight.get(key);
    if (running) return running as Promise<T>;

    const job = compute()
      .then(async (value) => {
        await this.write(key, JSON.stringify(value), policy?.serverSeconds ?? this.config.cache.ttlSeconds);
        return value;
      })
      .finally(() => this.inFlight.delete(key));
    this.inFlight.set(key, job);
    return job;
  }

  /** Borra todo lo que empiece con `prefix` (ej. al publicar una propiedad). */
  async forget(prefix: string): Promise<void> {
    for (const key of this.memory.keys()) if (key.startsWith(prefix)) this.memory.delete(key);
    if (!this.redis) return;
    try {
      const keys = await this.redis.keys(`${prefix}*`);
      if (keys.length > 0) await this.redis.del(...keys);
    } catch (error) {
      this.logger.warn(`No se pudo limpiar la cache: ${(error as Error).message}`);
    }
  }

  async onModuleDestroy() {
    await this.redis?.quit().catch(() => undefined);
  }

  // ---------------- Lectura y escritura (memoria o Redis) ----------------

  private async read(key: string): Promise<string | undefined> {
    if (this.redis) {
      try {
        return (await this.redis.get(key)) ?? undefined;
      } catch {
        return undefined; // Redis caido: se trata como "no hay cache"
      }
    }
    const entry = this.memory.get(key);
    if (!entry) return undefined;
    if (entry.expiresAt < Date.now()) {
      this.memory.delete(key);
      return undefined;
    }
    return entry.value;
  }

  private async write(key: string, value: string, ttl: number): Promise<void> {
    if (this.redis) {
      await this.redis.set(key, value, 'EX', ttl).catch(() => undefined);
      return;
    }
    // Memoria acotada: si se llena se descarta la entrada mas antigua.
    if (this.memory.size >= MAX_MEMORY_ENTRIES) this.memory.delete(this.memory.keys().next().value as string);
    this.memory.set(key, { value, expiresAt: Date.now() + ttl * 1000 });
  }
}
