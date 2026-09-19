-- DropIndex
DROP INDEX "Pergunta_enunciado_key";

-- AlterTable
ALTER TABLE "Rodada" ADD COLUMN     "ordem" INTEGER;

-- AlterTable
ALTER TABLE "Sala" ALTER COLUMN "status" SET DEFAULT 'ABERTA';
