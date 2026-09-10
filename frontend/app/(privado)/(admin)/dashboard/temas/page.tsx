"use client";

import {
  BookOpen,
  MoreVertical,
  Plus,
  Search,
} from "lucide-react";
import { useState } from "react";

const temas = [
  {
    id: 1,
    nome: "Programação",
    descricao: "Tecnologia, desenvolvimento e programação.",
    perguntas: 32,
  },
  {
    id: 2,
    nome: "Matemática",
    descricao: "Questões de matemática e raciocínio lógico.",
    perguntas: 24,
  },
  {
    id: 3,
    nome: "Geografia",
    descricao: "Países, cidades, mapas e conhecimentos geográficos.",
    perguntas: 18,
  },
  {
    id: 4,
    nome: "História",
    descricao: "História do Brasil e do mundo.",
    perguntas: 21,
  },
];

export default function TemasPage() {
  const [search, setSearch] = useState("");

  const filtered = temas.filter((tema) =>
    `${tema.nome} ${tema.descricao}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-2xl font-bold">
            Temas
          </h1>

          <p className="mt-1 text-sm text-zinc-500">
            Organize suas perguntas por categorias.
          </p>
        </div>

        <button className="flex w-fit items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold hover:bg-indigo-500">
          <Plus className="h-4 w-4" />
          Novo tema
        </button>
      </div>

      <div className="mb-6 flex items-center rounded-xl border border-white/10 bg-white/[0.02] px-4">
        <Search className="h-5 w-5 text-zinc-500" />

        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Pesquisar tema..."
          className="w-full bg-transparent px-3 py-3 text-sm text-white outline-none placeholder:text-zinc-600"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {filtered.map((tema) => (
          <div
            key={tema.id}
            className="group rounded-2xl border border-white/10 bg-white/[0.02] p-5 transition hover:-translate-y-1 hover:border-indigo-500/30"
          >
            <div className="flex items-start justify-between">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-500/10">
                <BookOpen className="h-6 w-6 text-purple-400" />
              </div>

              <button className="rounded-lg p-2 text-zinc-600 hover:bg-white/5 hover:text-white">
                <MoreVertical className="h-5 w-5" />
              </button>
            </div>

            <h2 className="mt-5 font-semibold text-white">
              {tema.nome}
            </h2>

            <p className="mt-2 min-h-10 text-sm leading-5 text-zinc-500">
              {tema.descricao}
            </p>

            <div className="mt-5 border-t border-white/5 pt-4">
              <span className="text-sm text-zinc-400">
                <strong className="text-white">
                  {tema.perguntas}
                </strong>{" "}
                perguntas
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}