-- Buscar eventos por IP sin guardar la IP en claro (la columna ip va cifrada): HMAC de la IP, solo para filtrar en el visor admin.

-- AlterTable
ALTER TABLE "AuditLog" ADD COLUMN     "ipHash" TEXT;

-- CreateIndex
CREATE INDEX "AuditLog_ipHash_createdAt_idx" ON "AuditLog"("ipHash", "createdAt");
