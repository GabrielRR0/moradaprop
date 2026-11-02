import { randomUUID } from 'node:crypto';
import { ArgumentsHost, Catch, HttpException, Logger, type ExceptionFilter } from '@nestjs/common';
import type { Response } from 'express';

/**
 * Atrapa lo que ningun controller manejo (errores de base, de correo, bugs): lo REGISTRA con su traza y responde
 * un 500 limpio con un codigo de referencia, sin detalles internos. Los errores HTTP normales (400, 401, 403...) pasan tal cual.
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger('Error');

  catch(exception: unknown, host: ArgumentsHost) {
    const http = host.switchToHttp();
    const res = http.getResponse<Response>();
    if (exception instanceof HttpException) {
      return res.status(exception.getStatus()).json(exception.getResponse());
    }

    const reference = randomUUID().slice(0, 8);
    const req = http.getRequest<{ method?: string; originalUrl?: string }>();
    const error = exception instanceof Error ? exception : new Error(String(exception));
    this.logger.error(`[${reference}] ${req.method} ${req.originalUrl}: ${error.name}: ${error.message}`, error.stack);
    return res.status(500).json({ statusCode: 500, error: 'Internal Server Error', message: 'Algo salió mal de nuestro lado. Inténtalo de nuevo.', reference });
  }
}
