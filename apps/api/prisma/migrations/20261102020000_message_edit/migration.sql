-- Los mensajes de una conversacion se pueden editar hasta 3 minutos despues de enviados: se guarda cuando se editaron por ultima vez.

-- AlterTable
ALTER TABLE "AppointmentMessage" ADD COLUMN     "editedAt" TIMESTAMP(3);

