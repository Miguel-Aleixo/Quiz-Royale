-- CreateTable
CREATE TABLE "Tema" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,

    CONSTRAINT "Tema_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Pergunta" (
    "id" SERIAL NOT NULL,
    "enunciado" TEXT NOT NULL,
    "temaId" INTEGER NOT NULL,

    CONSTRAINT "Pergunta_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Tema_nome_key" ON "Tema"("nome");

-- CreateIndex
CREATE UNIQUE INDEX "Pergunta_enunciado_key" ON "Pergunta"("enunciado");

-- AddForeignKey
ALTER TABLE "Pergunta" ADD CONSTRAINT "Pergunta_temaId_fkey" FOREIGN KEY ("temaId") REFERENCES "Tema"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
