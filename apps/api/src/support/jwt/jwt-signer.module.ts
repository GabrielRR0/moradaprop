import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { JwtSigner } from './jwt-signer.service';

// JwtModule sin secreto global: cada firma/verificacion pasa su secreto (access o challenge).
@Module({ imports: [JwtModule.register({})], providers: [JwtSigner], exports: [JwtSigner] })
export class JwtSignerModule {}
