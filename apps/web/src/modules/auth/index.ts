'use client';

// Archivo padre del modulo auth: unico punto de entrada.
export { AuthGate } from './components/AuthGate';
export { ForgotPage } from './components/ForgotPage';
export { LoginPage } from './components/LoginPage';
export { RegisterPage } from './components/RegisterPage';
export { SessionBoot } from './components/SessionBoot';
export { VerifyEmailPage } from './components/VerifyEmailPage';
export { authService } from './services/auth.service';
export { describeError, passkeyProblem } from './services/auth-errors';
export { passkeysSupported } from './services/webauthn';
export { endSession, updateEnrollment, updateUser, useSession } from './session/session.store';
export { useCooldown, clock } from './hooks/useCooldown';
export { routeAfterAuth } from './services/auth-routing';
export type { Problem } from './services/auth-errors';
