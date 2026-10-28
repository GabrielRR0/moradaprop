import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

export interface SignOptions {
  secret: string;
  /** Duracion: "15m", "7d" o segundos. */
  expiresIn: string | number;
}

/** @internal Usa `JwtSigner` desde support/jwt. */
@Injectable()
export class JwtSigner {
  constructor(private readonly jwt: JwtService) {}

  sign(payload: object, { secret, expiresIn }: SignOptions): Promise<string> {
    return this.jwt.signAsync(payload, { secret, expiresIn: expiresIn as never });
  }

  /** Lanza si la firma es invalida o el token vencio. */
  verify<T extends object>(token: string, secret: string): Promise<T> {
    return this.jwt.verifyAsync<T>(token, { secret });
  }
}
