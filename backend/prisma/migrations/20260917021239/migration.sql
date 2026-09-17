/*
  Warnings:

  - Added the required column `criadorId` to the `Sala` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Sala" ADD COLUMN     "criadorId" INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE "Sala" ADD CONSTRAINT "Sala_criadorId_fkey" FOREIGN KEY ("criadorId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
