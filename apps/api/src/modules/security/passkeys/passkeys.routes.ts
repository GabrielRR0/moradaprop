import type { Routes } from '@nestjs/core';
import { PasskeysModule } from './passkeys.module';

/** Mis passkeys: se montan bajo /api/auth (/auth/passkeys). */
export const passkeysRoutes: Routes = [{ path: 'auth', module: PasskeysModule }];
