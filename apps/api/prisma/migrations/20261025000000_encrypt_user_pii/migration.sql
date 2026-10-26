-- Datos personales de User cifrados (security/encryption).
-- "email", "name" y "phone" pasan a guardar texto cifrado; la busqueda usa "emailHash" y "searchTokens".
-- Pre-MVP: no hay migracion de datos en claro. Si la tabla tiene filas, este paso falla a proposito:
-- reinicia la base de desarrollo con `pnpm prisma migrate reset` (y vuelve a correr el seed).

-- DropIndex
DROP INDEX "User_email_key";

-- AlterTable
ALTER TABLE "User" ADD COLUMN "emailHash" TEXT NOT NULL,
ADD COLUMN "searchTokens" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- CreateIndex
CREATE UNIQUE INDEX "User_emailHash_key" ON "User"("emailHash");

-- CreateIndex
CREATE INDEX "User_searchTokens_idx" ON "User" USING GIN ("searchTokens");
