-- Riesgo de inicio de sesion (security/access-risk): dispositivos conocidos, donde suele entrar cada usuario, y el dispositivo/pais de cada sesion.

-- CreateEnum
CREATE TYPE "FootprintKind" AS ENUM ('COUNTRY', 'NETWORK');

-- AlterTable
ALTER TABLE "Session" ADD COLUMN     "country" TEXT,
ADD COLUMN     "deviceId" TEXT;

-- CreateTable
CREATE TABLE "TrustedDevice" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "secretHash" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "confirmedAt" TIMESTAMP(3),
    "firstSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastCountry" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),

    CONSTRAINT "TrustedDevice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LoginFootprint" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "kind" "FootprintKind" NOT NULL,
    "value" TEXT NOT NULL,
    "firstSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "seenCount" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "LoginFootprint_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TrustedDevice_secretHash_key" ON "TrustedDevice"("secretHash");

-- CreateIndex
CREATE INDEX "TrustedDevice_userId_idx" ON "TrustedDevice"("userId");

-- CreateIndex
CREATE INDEX "TrustedDevice_expiresAt_idx" ON "TrustedDevice"("expiresAt");

-- CreateIndex
CREATE INDEX "LoginFootprint_userId_kind_lastSeenAt_idx" ON "LoginFootprint"("userId", "kind", "lastSeenAt");

-- CreateIndex
CREATE UNIQUE INDEX "LoginFootprint_userId_kind_value_key" ON "LoginFootprint"("userId", "kind", "value");

-- CreateIndex
CREATE INDEX "Session_deviceId_idx" ON "Session"("deviceId");

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "TrustedDevice"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrustedDevice" ADD CONSTRAINT "TrustedDevice_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoginFootprint" ADD CONSTRAINT "LoginFootprint_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

