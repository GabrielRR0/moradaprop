import { appendFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

export const CASES_FILE = join(__dirname, '..', '..', '.test-report', 'cases.jsonl');

interface CaseDefinition<T> {
  /** Que prueba este caso (en lenguaje humano). */
  que: string;
  /** Que se espera que ocurra. */
  espera: string;
  /** Ejecuta la accion y devuelve lo que se obtuvo. */
  ejecutar: () => T | Promise<T>;
  /** Verifica lo obtenido con expect(...). */
  verificar: (obtenido: T) => void;
  /** Texto corto de lo obtenido para el reporte (por defecto, JSON del valor). */
  describirObtenido?: (obtenido: T) => string;
}

function resumir(valor: unknown): string {
  try {
    const texto = typeof valor === 'string' ? valor : JSON.stringify(valor);
    return texto && texto.length > 160 ? `${texto.slice(0, 157)}...` : String(texto);
  } catch {
    return String(valor);
  }
}

function registrar(modulo: string, que: string, espera: string, obtuvo: string, ok: boolean) {
  mkdirSync(join(CASES_FILE, '..'), { recursive: true });
  appendFileSync(CASES_FILE, `${JSON.stringify({ modulo, que, espera, obtuvo, ok })}\n`);
}

/**
 * Define un test que documenta QUE prueba, QUE espera y QUE obtuvo.
 * El reporter en espanol imprime esas tres lineas por cada caso.
 */
export function describeCase<T>(modulo: string, caso: CaseDefinition<T>) {
  it(caso.que, async () => {
    const obtenido = await caso.ejecutar();
    const obtuvo = (caso.describirObtenido ?? resumir)(obtenido);
    try {
      caso.verificar(obtenido);
      registrar(modulo, caso.que, caso.espera, obtuvo, true);
    } catch (error) {
      registrar(modulo, caso.que, caso.espera, obtuvo, false);
      throw error;
    }
  });
}
