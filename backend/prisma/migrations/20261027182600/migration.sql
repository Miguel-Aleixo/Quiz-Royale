-- AlterTable
ALTER TABLE "Pergunta" ADD COLUMN     "criadorId" INTEGER;

-- AlterTable
ALTER TABLE "Rodada" ADD COLUMN     "alternativasSnapshot" JSONB,
ADD COLUMN     "enunciadoSnapshot" TEXT;

-- AddForeignKey
ALTER TABLE "Pergunta" ADD CONSTRAINT "Pergunta_criadorId_fkey" FOREIGN KEY ("criadorId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;
