-- Segundo factor obligatorio (security/second-factor): desde cuando una cuenta con rol de admin, dueño o agencia debe
-- tener passkey o 2FA. NULL = el plazo aun no empezo (empieza al emitir su proximo token).

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "secondFactorRequiredFrom" TIMESTAMP(3);

-- Cuentas que YA existian con rol de dueño o agencia: 7 dias de gracia contados desde esta migracion.
-- (Las de admin no se rellenan: empiezan de inmediato; los clientes no tienen obligacion.)
UPDATE "User"
SET "secondFactorRequiredFrom" = NOW() + INTERVAL '7 days'
WHERE "roles" && ARRAY['OWNER', 'AGENCY']::"Role"[]
  AND "twoFactorEnabled" = false
  AND "secondFactorRequiredFrom" IS NULL;
