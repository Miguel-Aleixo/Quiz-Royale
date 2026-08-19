-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'MODERADOR', 'JOGADOR');

-- AlterTable
ALTER TABLE "Usuario" ADD COLUMN     "role" "Role" NOT NULL DEFAULT 'JOGADOR';
