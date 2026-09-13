-- DropForeignKey
ALTER TABLE "Usuario" DROP CONSTRAINT "Usuario_patenteId_fkey";

-- AlterTable
ALTER TABLE "Usuario" ALTER COLUMN "patenteId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Usuario" ADD CONSTRAINT "Usuario_patenteId_fkey" FOREIGN KEY ("patenteId") REFERENCES "Patente"("id") ON DELETE SET NULL ON UPDATE CASCADE;
