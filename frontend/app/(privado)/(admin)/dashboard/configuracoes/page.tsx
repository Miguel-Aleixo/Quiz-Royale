"use client";

import {
  Bell,
  Lock,
  Save,
  Settings,
  Shield,
} from "lucide-react";
import { useState } from "react";

export default function ConfiguracoesPage() {
  const [nome, setNome] = useState("Quiz Royale");
  const [maxJogadores, setMaxJogadores] = useState("50");
  const [tempo, setTempo] = useState("20");

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">
          Configurações
        </h1>

        <p className="mt-1 text-sm text-zinc-500">
          Configure o funcionamento do Quiz Royale.
        </p>
      </div>

      <div className="max-w-3xl space-y-5">
        {/* Geral */}
        <section className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10">
              <Settings className="h-5 w-5 text-indigo-400" />
            </div>

            <div>
              <h2 className="font-semibold text-white">
                Configurações gerais
              </h2>

              <p className="text-xs text-zinc-600">
                Informações básicas da plataforma.
              </p>
            </div>
          </div>

          <div className="space-y-5">
            <div>
              <label className="mb-2 block text-sm font-medium text-zinc-300">
                Nome da plataforma
              </label>

              <input
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none transition focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-zinc-300">
                Máximo de jogadores por sala
              </label>

              <input
                type="number"
                value={maxJogadores}
                onChange={(e) => setMaxJogadores(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none transition focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-zinc-300">
                Tempo padrão por pergunta
              </label>

              <div className="flex items-center gap-3">
                <input
                  type="number"
                  value={tempo}
                  onChange={(e) => setTempo(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none transition focus:border-indigo-500"
                />

                <span className="text-sm text-zinc-600">
                  segundos
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Segurança */}
        <section className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10">
              <Shield className="h-5 w-5 text-emerald-400" />
            </div>

            <div>
              <h2 className="font-semibold text-white">
                Segurança
              </h2>

              <p className="text-xs text-zinc-600">
                Configurações de segurança da plataforma.
              </p>
            </div>
          </div>

          <div className="mt-6 space-y-3">
            <div className="flex items-center justify-between rounded-xl bg-white/[0.03] p-4">
              <div className="flex items-center gap-3">
                <Lock className="h-5 w-5 text-zinc-500" />

                <div>
                  <p className="text-sm font-medium text-white">
                    Autenticação JWT
                  </p>

                  <p className="text-xs text-zinc-600">
                    Proteção das sessões dos usuários.
                  </p>
                </div>
              </div>

              <span className="text-xs font-medium text-emerald-400">
                Ativo
              </span>
            </div>

            <div className="flex items-center justify-between rounded-xl bg-white/[0.03] p-4">
              <div className="flex items-center gap-3">
                <Bell className="h-5 w-5 text-zinc-500" />

                <div>
                  <p className="text-sm font-medium text-white">
                    Notificações
                  </p>

                  <p className="text-xs text-zinc-600">
                    Alertas administrativos.
                  </p>
                </div>
              </div>

              <span className="text-xs font-medium text-emerald-400">
                Ativo
              </span>
            </div>
          </div>
        </section>

        {/* Salvar */}
        <div className="flex justify-end">
          <button className="flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-indigo-500">
            <Save className="h-4 w-4" />
            Salvar configurações
          </button>
        </div>
      </div>
    </div>
  );
}