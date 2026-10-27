/*
  Warnings:

  - You are about to drop the column `alternativasSnapshot` on the `Rodada` table. All the data in the column will be lost.
  - You are about to drop the column `enunciadoSnapshot` on the `Rodada` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Rodada" DROP COLUMN "alternativasSnapshot",
DROP COLUMN "enunciadoSnapshot";
