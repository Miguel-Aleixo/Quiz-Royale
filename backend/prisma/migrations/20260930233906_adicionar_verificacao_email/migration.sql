-- AlterTable
ALTER TABLE "Usuario" ADD COLUMN     "emailVerificado" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "VerificacaoEmail" (
    "id" SERIAL NOT NULL,
    "token" TEXT NOT NULL,
    "usuarioId" INTEGER NOT NULL,
    "expiraEm" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VerificacaoEmail_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "VerificacaoEmail_token_key" ON "VerificacaoEmail"("token");

-- CreateIndex
CREATE UNIQUE INDEX "VerificacaoEmail_usuarioId_key" ON "VerificacaoEmail"("usuarioId");

-- AddForeignKey
ALTER TABLE "VerificacaoEmail" ADD CONSTRAINT "VerificacaoEmail_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;
