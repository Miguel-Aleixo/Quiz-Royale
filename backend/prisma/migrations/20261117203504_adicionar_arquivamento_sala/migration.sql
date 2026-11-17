-- AlterTable
ALTER TABLE "Sala" ADD COLUMN     "arquivada" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "arquivadaEm" TIMESTAMP(3);
