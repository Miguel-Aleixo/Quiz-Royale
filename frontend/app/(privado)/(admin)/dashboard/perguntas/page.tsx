"use client";

import Link from "next/link";
import {
  CheckCircle2,
  HelpCircle,
  Plus,
  Search,
  Tags,
  XCircle,
} from "lucide-react";
import { useState } from "react";

const perguntas = [
  {
    id: 1,
    enunciado: "O que é o protocolo HTTP?",
    tema: "Programação",
    alternativas: 4,
    correta: "HyperText Transfer Protocol",
  },
  {
    id: 2,
    enunciado: "Quanto é 15 × 8?",
    tema: "Matemática",
    alternativas: 4,
    correta: "120",
  },
  {
    id: 3,
    enunciado: "Qual é a capital do Brasil?",
    tema: "Geografia",
    alternativas: 4,
    correta: "Brasília",
  },
  {
    id: 4,
    enunciado: "O que significa HTML?",
    tema: "Programação",
    alternativas: 4,
    correta: "HyperText Markup Language",
  },
];

export default function PerguntasPage() {
  const [search, setSearch] = useState("");

  const filtered = perguntas.filter((pergunta) =>
    `${pergunta.enunciado} ${pergunta.tema}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-2xl font-bold">
            Perguntas
          </h1>

          <p className="mt-1 text-sm text-zinc-500">
            Crie e gerencie as perguntas dos quizzes.
          </p>
        </div>

        <Link
          href="/dashboard/admin/perguntas/nova"
          className="flex w-fit items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold hover:bg-indigo-500"
        >
          <Plus className="h-4 w-4" />
          Nova pergunta
        </Link>
      </div>

      <div className="mb-6 flex items-center rounded-xl border border-white/10 bg-white/[0.02] px-4">
        <Search className="h-5 w-5 text-zinc-500" />

        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Pesquisar pergunta ou tema..."
          className="w-full bg-transparent px-3 py-3 text-sm text-white outline-none placeholder:text-zinc-600"
        />
      </div>

      <div className="space-y-3">
        {filtered.map((pergunta) => (
          <div
            key={pergunta.id}
            className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 transition hover:border-indigo-500/30"
          >
            <div className="flex flex-col justify-between gap-4 md:flex-row">
              <div className="flex gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-500/10">
                  <HelpCircle className="h-5 w-5 text-indigo-400" />
                </div>

                <div>
                  <h2 className="font-medium text-white">
                    {pergunta.enunciado}
                  </h2>

                  <div className="mt-2 flex flex-wrap gap-2">
                    <span className="flex items-center gap-1 rounded-lg bg-purple-500/10 px-2.5 py-1 text-xs text-purple-400">
                      <Tags className="h-3 w-3" />
                      {pergunta.tema}
                    </span>

                    <span className="rounded-lg bg-white/5 px-2.5 py-1 text-xs text-zinc-400">
                      {pergunta.alternativas} alternativas
                    </span>
                  </div>
                </div>
              </div>

              <div className="md:text-right">
                <p className="text-xs text-zinc-600">
                  Resposta correta
                </p>

                <div className="mt-1 flex items-center gap-2 text-sm text-emerald-400 md:justify-end">
                  <CheckCircle2 className="h-4 w-4" />
                  {pergunta.correta}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="py-20 text-center">
          <XCircle className="mx-auto h-10 w-10 text-zinc-700" />

          <p className="mt-4 text-zinc-500">
            Nenhuma pergunta encontrada.
          </p>
        </div>
      )}
    </div>
  );
}