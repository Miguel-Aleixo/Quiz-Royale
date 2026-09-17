-- DropForeignKey
ALTER TABLE "Sala" DROP CONSTRAINT "Sala_criadorId_fkey";

-- AlterTable
ALTER TABLE "Sala" ALTER COLUMN "criadorId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Sala" ADD CONSTRAINT "Sala_criadorId_fkey" FOREIGN KEY ("criadorId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;
