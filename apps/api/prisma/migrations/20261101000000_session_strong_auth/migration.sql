-- Segundo factor reciente (security/second-factor): cuando la sesion paso por ultima vez un codigo 2FA o una passkey.
-- Las acciones sensibles de admin (suspender, bloquear, guardar claves) piden que haya sido hace pocos minutos.

-- AlterTable
ALTER TABLE "Session" ADD COLUMN     "strongAuthAt" TIMESTAMP(3);

-- Sesiones que ya verificaron el 2FA: se toma su ultimo uso como referencia.
UPDATE "Session" SET "strongAuthAt" = "lastUsedAt" WHERE "twoFactorVerified" = true;
