-- Conversaciones de las solicitudes: mensajes, fechas de visita propuestas, estado ABIERTA, tipos INTERES y PREGUNTA,
-- marcas de 'visto', ultima actividad y propiedades reservadas que ya no aceptan citas (acceptsVisits).

-- CreateEnum
CREATE TYPE "MessageKind" AS ENUM ('TEXTO', 'PROPUESTA', 'ACUERDO');

-- CreateEnum
CREATE TYPE "SlotStatus" AS ENUM ('PROPUESTA', 'ACEPTADA', 'DESCARTADA');

-- AlterEnum

ALTER TYPE "AppointmentType" ADD VALUE 'INTERES';
ALTER TYPE "AppointmentType" ADD VALUE 'PREGUNTA';

-- AlterEnum
ALTER TYPE "AppointmentStatus" ADD VALUE 'ABIERTA';

-- AlterTable
ALTER TABLE "Property" ADD COLUMN     "acceptsVisits" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "Appointment" ADD COLUMN     "clientSeenAt" TIMESTAMP(3),
ADD COLUMN     "lastMessageAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "managerSeenAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "AppointmentMessage" (
    "id" TEXT NOT NULL,
    "appointmentId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "kind" "MessageKind" NOT NULL DEFAULT 'TEXTO',
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AppointmentMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AppointmentSlot" (
    "id" TEXT NOT NULL,
    "appointmentId" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "status" "SlotStatus" NOT NULL DEFAULT 'PROPUESTA',

    CONSTRAINT "AppointmentSlot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AppointmentMessage_appointmentId_createdAt_idx" ON "AppointmentMessage"("appointmentId", "createdAt");

-- CreateIndex
CREATE INDEX "AppointmentSlot_appointmentId_status_idx" ON "AppointmentSlot"("appointmentId", "status");

-- CreateIndex
CREATE INDEX "AppointmentSlot_messageId_idx" ON "AppointmentSlot"("messageId");

-- AddForeignKey
ALTER TABLE "AppointmentMessage" ADD CONSTRAINT "AppointmentMessage_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "Appointment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AppointmentSlot" ADD CONSTRAINT "AppointmentSlot_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "Appointment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AppointmentSlot" ADD CONSTRAINT "AppointmentSlot_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "AppointmentMessage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

