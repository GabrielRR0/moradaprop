-- Textos reutilizables para responder mensajes: privados o compartidos con el equipo de la inmobiliaria (titulo y texto cifrados).

-- CreateTable
CREATE TABLE "ReplyTemplate" (
    "id" TEXT NOT NULL,
    "ownerUserId" TEXT NOT NULL,
    "agencyId" TEXT,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReplyTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ReplyTemplate_ownerUserId_idx" ON "ReplyTemplate"("ownerUserId");

-- CreateIndex
CREATE INDEX "ReplyTemplate_agencyId_idx" ON "ReplyTemplate"("agencyId");

-- AddForeignKey
ALTER TABLE "ReplyTemplate" ADD CONSTRAINT "ReplyTemplate_ownerUserId_fkey" FOREIGN KEY ("ownerUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReplyTemplate" ADD CONSTRAINT "ReplyTemplate_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "AgencyProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

