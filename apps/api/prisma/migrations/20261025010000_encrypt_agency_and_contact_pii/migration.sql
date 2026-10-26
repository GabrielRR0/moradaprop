-- Datos de agencias, citas, sesiones y auditoria cifrados (security/encryption).
-- Solo cambian los indices unicos: RIF y correo invitado ahora se buscan por su HMAC.
-- Pre-MVP: sin migracion de datos en claro. Si hay filas, falla a proposito: `pnpm prisma migrate reset`.

-- DropIndex
DROP INDEX "AgencyProfile_rif_key";
DROP INDEX "AgencyMember_agencyId_invitedEmail_key";

-- AlterTable
ALTER TABLE "AgencyProfile" ADD COLUMN "rifHash" TEXT;
ALTER TABLE "AgencyMember" ADD COLUMN "invitedEmailHash" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "AgencyProfile_rifHash_key" ON "AgencyProfile"("rifHash");
CREATE UNIQUE INDEX "AgencyMember_agencyId_invitedEmailHash_key" ON "AgencyMember"("agencyId", "invitedEmailHash");
