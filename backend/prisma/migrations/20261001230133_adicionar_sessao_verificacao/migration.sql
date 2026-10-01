/*
  Warnings:

  - A unique constraint covering the columns `[sessaoToken]` on the table `VerificacaoEmail` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `sessaoToken` to the `VerificacaoEmail` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "VerificacaoEmail" ADD COLUMN     "sessaoToken" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "VerificacaoEmail_sessaoToken_key" ON "VerificacaoEmail"("sessaoToken");
