-- Passkeys (security/passkeys): credenciales WebAuthn (solo clave publica) y desafios de un solo uso.

-- CreateEnum
CREATE TYPE "PasskeyChallengeKind" AS ENUM ('REGISTER', 'LOGIN', 'STEP_UP');

-- CreateTable
CREATE TABLE "PasskeyCredential" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "credentialId" TEXT NOT NULL,
    "publicKey" TEXT NOT NULL,
    "algorithm" INTEGER NOT NULL,
    "signCount" BIGINT NOT NULL DEFAULT 0,
    "transports" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "label" TEXT NOT NULL,
    "backedUp" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastUsedAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),

    CONSTRAINT "PasskeyCredential_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PasskeyChallenge" (
    "id" TEXT NOT NULL,
    "challengeHash" TEXT NOT NULL,
    "kind" "PasskeyChallengeKind" NOT NULL,
    "userId" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PasskeyChallenge_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PasskeyCredential_credentialId_key" ON "PasskeyCredential"("credentialId");

-- CreateIndex
CREATE INDEX "PasskeyCredential_userId_idx" ON "PasskeyCredential"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "PasskeyChallenge_challengeHash_key" ON "PasskeyChallenge"("challengeHash");

-- CreateIndex
CREATE INDEX "PasskeyChallenge_expiresAt_idx" ON "PasskeyChallenge"("expiresAt");

-- AddForeignKey
ALTER TABLE "PasskeyCredential" ADD CONSTRAINT "PasskeyCredential_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

