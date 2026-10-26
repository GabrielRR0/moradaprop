import { Injectable } from '@nestjs/common';

/** Tope de sujetos recordados: un atacante con millones de IPs no puede llenar la memoria. */
const MAX_KEYS = 10_000;

/**
 * Libro de hechos con ventana deslizante: cuantas veces paso algo en los ultimos N segundos.
 * Vive en la memoria de este servidor (cada servidor cuenta aparte). Para compartirlo entre
 * servidores basta reemplazar este archivo por uno con Redis y la misma interfaz.
 */
@Injectable()
export class ThreatLedgerService {
  private readonly hits = new Map<string, number[]>();

  /** Anota un hecho y devuelve cuantos hay dentro de la ventana (incluido este). */
  hit(key: string, windowSec: number, now = Date.now()): number {
    const since = now - windowSec * 1000;
    const recent = (this.hits.get(key) ?? []).filter((t) => t > since);
    recent.push(now);

    this.hits.delete(key); // se reinserta para que el Map quede ordenado de mas viejo a mas nuevo
    if (this.hits.size >= MAX_KEYS) this.hits.delete(this.hits.keys().next().value as string);
    this.hits.set(key, recent);
    return recent.length;
  }

  clear(key: string): void {
    this.hits.delete(key);
  }
}
