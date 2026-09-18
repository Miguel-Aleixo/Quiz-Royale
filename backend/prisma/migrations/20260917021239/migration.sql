/*
  Adiciona o criador da sala como opcional.
  Salas existentes ficarão com criadorId = NULL.
*/

-- AlterTable
ALTER TABLE "Sala"
ADD COLUMN "criadorId" INTEGER;

-- AddForeignKey
ALTER TABLE "Sala"
ADD CONSTRAINT "Sala_criadorId_fkey"
FOREIGN KEY ("criadorId")
REFERENCES "Usuario"("id")
ON DELETE SET NULL
ON UPDATE CASCADE;