"use client";

import {
  Crown,
  Search,
  Shield,
  Trophy,
  User,
} from "lucide-react";
import { useState } from "react";

const jogadores = [
  {
    id: 1,
    nome: "Miguel Aleixo",
    email: "miguel@email.com",
    patente: "Ouro",
    partidas: 42,
    vitorias: 21,
  },
  {
    id: 2,
    nome: "Lucas Santos",
    email: "lucas@email.com",
    patente: "Prata",
    partidas: 35,
    vitorias: 15,
  },
  {
    id: 3,
    nome: "Gabriel Oliveira",
    email: "gabriel@email.com",
    patente: "Bronze",
    partidas: 27,
    vitorias: 8,
  },
  {
    id: 4,
    nome: "João Pedro",
    email: "joao@email.com",
    patente: "Ouro",
    partidas: 51,
    vitorias: 29,
  },
];

export default function JogadoresPage() {
  const [search, setSearch] = useState("");

  const filtered = jogadores.filter((jogador) =>
    `${jogador.nome} ${jogador.email}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">
          Jogadores
        </h1>

        <p className="mt-1 text-sm text-zinc-500">
          Visualize os jogadores cadastrados no Quiz Royale.
        </p>
      </div>

      <div className="mb-6 flex items-center rounded-xl border border-white/10 bg-white/[0.02] px-4">
        <Search className="h-5 w-5 text-zinc-500" />

        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Pesquisar jogador..."
          className="w-full bg-transparent px-3 py-3 text-sm text-white outline-none placeholder:text-zinc-600"
        />
      </div>

      <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02]">
        <div className="hidden grid-cols-5 border-b border-white/10 px-6 py-4 text-xs font-semibold uppercase tracking-wider text-zinc-600 md:grid">
          <span className="col-span-2">Jogador</span>
          <span>Patente</span>
          <span>Partidas</span>
          <span>Vitórias</span>
        </div>

        {filtered.map((jogador) => (
          <div
            key={jogador.id}
            className="grid gap-4 border-b border-white/5 px-6 py-5 last:border-0 md:grid-cols-5 md:items-center"
          >
            <div className="flex items-center gap-3 md:col-span-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-500/10">
                <User className="h-5 w-5 text-indigo-400" />
              </div>

              <div>
                <p className="font-medium text-white">
                  {jogador.nome}
                </p>

                <p className="text-xs text-zinc-600">
                  {jogador.email}
                </p>
              </div>
            </div>

            <div>
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-yellow-500/10 px-2.5 py-1.5 text-xs font-medium text-yellow-400">
                {jogador.patente === "Ouro" ? (
                  <Crown className="h-3.5 w-3.5" />
                ) : (
                  <Shield className="h-3.5 w-3.5" />
                )}

                {jogador.patente}
              </span>
            </div>

            <div className="flex items-center gap-2 text-sm text-zinc-400">
              <Trophy className="h-4 w-4 text-zinc-600" />
              {jogador.partidas}
            </div>

            <div className="text-sm font-semibold text-emerald-400">
              {jogador.vitorias}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}