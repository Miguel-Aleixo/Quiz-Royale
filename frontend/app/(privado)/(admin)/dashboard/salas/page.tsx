"use client";

import Link from "next/link";
import {
  Clock,
  Gamepad2,
  MoreVertical,
  Plus,
  Search,
  Users,
} from "lucide-react";
import { useState } from "react";

const salas = [
  {
    id: 1,
    nome: "Desafio de Matemática",
    codigo: "MAT2026",
    jogadores: 32,
    max: 50,
    status: "aberta",
  },
  {
    id: 2,
    nome: "Conhecimentos Gerais",
    codigo: "GERAL10",
    jogadores: 18,
    max: 30,
    status: "em andamento",
  },
  {
    id: 3,
    nome: "Programação Web",
    codigo: "WEBDEV",
    jogadores: 25,
    max: 50,
    status: "encerrada",
  },
  {
    id: 4,
    nome: "Desafio ETEC",
    codigo: "ETEC26",
    jogadores: 12,
    max: 20,
    status: "aberta",
  },
];

export default function SalasPage() {
  const [search, setSearch] = useState("");

  const filteredSalas = salas.filter((sala) =>
    `${sala.nome} ${sala.codigo}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-2xl font-bold text-white">
            Salas
          </h1>

          <p className="mt-1 text-sm text-zinc-500">
            Gerencie as salas de quiz do sistema.
          </p>
        </div>

        <Link
          href="/dashboard/admin/salas/nova"
          className="flex w-fit items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-500"
        >
          <Plus className="h-4 w-4" />
          Nova sala
        </Link>
      </div>

      {/* Filtros */}
      <div className="mb-6 flex items-center rounded-xl border border-white/10 bg-white/[0.02] px-4">
        <Search className="h-5 w-5 text-zinc-500" />

        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Pesquisar sala..."
          className="w-full bg-transparent px-3 py-3 text-sm text-white outline-none placeholder:text-zinc-600"
        />
      </div>

      {/* Cards */}
      <div className="grid gap-4 xl:grid-cols-2">
        {filteredSalas.map((sala) => (
          <div
            key={sala.id}
            className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 transition hover:border-indigo-500/30"
          >
            <div className="flex items-start justify-between">
              <div className="flex gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-500/10">
                  <Gamepad2 className="h-6 w-6 text-indigo-400" />
                </div>

                <div>
                  <h2 className="font-semibold text-white">
                    {sala.nome}
                  </h2>

                  <p className="mt-1 font-mono text-xs text-zinc-500">
                    Código: {sala.codigo}
                  </p>
                </div>
              </div>

              <button className="rounded-lg p-2 text-zinc-500 hover:bg-white/5 hover:text-white">
                <MoreVertical className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-white/[0.03] p-3">
                <div className="flex items-center gap-2 text-zinc-500">
                  <Users className="h-4 w-4" />
                  <span className="text-xs">Jogadores</span>
                </div>

                <p className="mt-2 text-lg font-bold text-white">
                  {sala.jogadores}
                  <span className="text-sm font-normal text-zinc-600">
                    /{sala.max}
                  </span>
                </p>
              </div>

              <div className="rounded-xl bg-white/[0.03] p-3">
                <div className="flex items-center gap-2 text-zinc-500">
                  <Clock className="h-4 w-4" />
                  <span className="text-xs">Status</span>
                </div>

                <p className="mt-2 text-sm font-semibold capitalize text-white">
                  {sala.status}
                </p>
              </div>
            </div>

            <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-white/5">
              <div
                className="h-full rounded-full bg-indigo-500"
                style={{
                  width: `${(sala.jogadores / sala.max) * 100}%`,
                }}
              />
            </div>
          </div>
        ))}
      </div>

      {filteredSalas.length === 0 && (
        <div className="py-20 text-center">
          <Gamepad2 className="mx-auto h-10 w-10 text-zinc-700" />

          <p className="mt-4 text-zinc-500">
            Nenhuma sala encontrada.
          </p>
        </div>
      )}
    </div>
  );
}