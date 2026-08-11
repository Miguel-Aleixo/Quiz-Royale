-- CreateTable
CREATE TABLE "Jogador" (
    "id" SERIAL NOT NULL,
    "usuarioId" INTEGER NOT NULL,
    "salaId" INTEGER NOT NULL,
    "eliminado" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Jogador_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Sala" (
    "id" SERIAL NOT NULL,
    "codigo" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'aberta',
    "maxJogadores" INTEGER NOT NULL,

    CONSTRAINT "Sala_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Rodada" (
    "id" SERIAL NOT NULL,
    "perguntaId" INTEGER NOT NULL,
    "salaId" INTEGER NOT NULL,
    "tempoLimite" INTEGER NOT NULL,

    CONSTRAINT "Rodada_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Alternativa" (
    "id" SERIAL NOT NULL,
    "perguntaId" INTEGER NOT NULL,
    "texto" TEXT NOT NULL,
    "correta" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Alternativa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Resposta" (
    "id" SERIAL NOT NULL,
    "tempoResposta" INTEGER NOT NULL,
    "jogadorId" INTEGER NOT NULL,
    "alternativaId" INTEGER NOT NULL,

    CONSTRAINT "Resposta_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Sala_codigo_key" ON "Sala"("codigo");

-- AddForeignKey
ALTER TABLE "Jogador" ADD CONSTRAINT "Jogador_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Jogador" ADD CONSTRAINT "Jogador_salaId_fkey" FOREIGN KEY ("salaId") REFERENCES "Sala"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Rodada" ADD CONSTRAINT "Rodada_perguntaId_fkey" FOREIGN KEY ("perguntaId") REFERENCES "Pergunta"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Rodada" ADD CONSTRAINT "Rodada_salaId_fkey" FOREIGN KEY ("salaId") REFERENCES "Sala"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Alternativa" ADD CONSTRAINT "Alternativa_perguntaId_fkey" FOREIGN KEY ("perguntaId") REFERENCES "Pergunta"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Resposta" ADD CONSTRAINT "Resposta_jogadorId_fkey" FOREIGN KEY ("jogadorId") REFERENCES "Jogador"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Resposta" ADD CONSTRAINT "Resposta_alternativaId_fkey" FOREIGN KEY ("alternativaId") REFERENCES "Alternativa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
