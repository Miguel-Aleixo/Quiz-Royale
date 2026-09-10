"use client";

import { useState } from "react";
import {
  Gamepad2,
  Trophy,
  Crown,
  User,
  LogOut,
  ArrowRight,
  Swords,
  Users,
  Shield,
} from "lucide-react";

export default function Home() {
  const [codigo, setCodigo] = useState("");

  function entrarNaSala() {
    if (!codigo.trim()) return;

    // Depois vamos conectar com sua API
    console.log("Entrando na sala:", codigo);
  }

  return (
    <main className="min-h-screen bg-[#080812] text-white">
      {/* Background */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-[-300px] h-[600px] w-[600px] -translate-x-1/2 rounded-full bg-purple-700/20 blur-[140px]" />
        <div className="absolute bottom-[-250px] left-[-150px] h-[500px] w-[500px] rounded-full bg-indigo-700/10 blur-[130px]" />
        <div className="absolute right-[-150px] top-1/3 h-[500px] w-[500px] rounded-full bg-blue-700/10 blur-[130px]" />
      </div>

      {/* Navbar */}
      <header className="relative z-10 border-b border-white/5 bg-[#080812]/80 backdrop-blur-xl">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6">
          
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-purple-600 to-indigo-600 shadow-lg shadow-purple-900/30">
              <Crown size={23} />
            </div>

            <div>
              <h1 className="text-lg font-black tracking-tight">
                QUIZ <span className="text-purple-400">ROYALE</span>
              </h1>
              <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-white/30">
                Battle of Knowledge
              </p>
            </div>
          </div>

          {/* Perfil */}
          <div className="flex items-center gap-4">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-semibold">Miguel</p>
              <p className="text-xs text-purple-400">Jogador</p>
            </div>

            <button
              className="
                flex h-11 w-11 items-center justify-center
                rounded-xl border border-white/10
                bg-white/5 text-white/70
                transition hover:border-purple-500/30
                hover:bg-purple-500/10 hover:text-white
              "
            >
              <User size={19} />
            </button>

            <button
              className="
                hidden h-11 w-11 items-center justify-center
                rounded-xl border border-white/10
                bg-white/5 text-white/50
                transition hover:border-red-500/30
                hover:bg-red-500/10 hover:text-red-400
                sm:flex
              "
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </header>

      {/* Conteúdo */}
      <section className="relative z-10 mx-auto max-w-7xl px-6 py-12">
        
        {/* Saudação */}
        <div className="mb-10">
          <p className="mb-2 text-sm font-medium text-purple-400">
            BEM-VINDO DE VOLTA
          </p>

          <h2 className="text-4xl font-black tracking-tight sm:text-5xl">
            Pronto para o
            <span className="block bg-gradient-to-r from-purple-400 via-indigo-400 to-blue-400 bg-clip-text text-transparent">
              próximo desafio?
            </span>
          </h2>

          <p className="mt-4 max-w-xl text-sm leading-6 text-white/45">
            Entre em uma sala utilizando o código fornecido pelo administrador
            e dispute a batalha pelo topo do ranking.
          </p>
        </div>

        {/* Grid principal */}
        <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
          
          {/* Entrar na sala */}
          <div
            className="
              relative overflow-hidden rounded-3xl
              border border-white/10
              bg-gradient-to-br from-[#151326] to-[#0e0e19]
              p-8 shadow-2xl
            "
          >
            {/* brilho */}
            <div className="absolute right-[-100px] top-[-100px] h-72 w-72 rounded-full bg-purple-600/10 blur-3xl" />

            <div className="relative">
              
              {/* Icon */}
              <div className="mb-7 flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-500/10 text-purple-400 ring-1 ring-purple-500/20">
                <Swords size={27} />
              </div>

              <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-purple-400">
                Entrar na batalha
              </p>

              <h3 className="text-3xl font-black">
                Digite o código da sala
              </h3>

              <p className="mt-3 max-w-lg text-sm leading-6 text-white/40">
                Insira o código de acesso que foi fornecido pelo administrador
                da partida.
              </p>

              {/* Input */}
              <div className="mt-8">
                <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-white/40">
                  Código da sala
                </label>

                <div className="flex flex-col gap-3 sm:flex-row">
                  <input
                    type="text"
                    maxLength={10}
                    value={codigo}
                    onChange={(e) =>
                      setCodigo(e.target.value.toUpperCase())
                    }
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        entrarNaSala();
                      }
                    }}
                    placeholder="EX: 8K4P2A"
                    className="
                      h-14 flex-1 rounded-xl
                      border border-white/10
                      bg-black/20 px-5
                      text-center text-lg font-bold
                      tracking-[0.25em] text-white
                      outline-none
                      placeholder:text-white/15
                      focus:border-purple-500/60
                      focus:ring-4 focus:ring-purple-500/10
                    "
                  />

                  <button
                    onClick={entrarNaSala}
                    disabled={!codigo.trim()}
                    className="
                      flex h-14 items-center justify-center gap-2
                      rounded-xl px-7
                      bg-gradient-to-r from-purple-600 to-indigo-600
                      font-bold
                      shadow-lg shadow-purple-900/20
                      transition
                      hover:scale-[1.02]
                      hover:from-purple-500 hover:to-indigo-500
                      disabled:cursor-not-allowed
                      disabled:opacity-40
                      disabled:hover:scale-100
                    "
                  >
                    Entrar
                    <ArrowRight size={18} />
                  </button>
                </div>
              </div>

              {/* Info */}
              <div className="mt-7 flex items-center gap-2 text-xs text-white/25">
                <Shield size={14} />
                <span>O código é fornecido pelo administrador da sala.</span>
              </div>
            </div>
          </div>

          {/* Perfil */}
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-1">
            
            {/* Patente */}
            <div
              className="
                rounded-3xl border border-white/10
                bg-white/[0.03] p-7
              "
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-white/30">
                    Sua patente
                  </p>

                  <h3 className="mt-2 text-2xl font-black">
                    Bronze
                  </h3>
                </div>

                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-yellow-500/10 text-yellow-400">
                  <Trophy size={23} />
                </div>
              </div>

              <div className="mt-6 h-2 overflow-hidden rounded-full bg-white/5">
                <div className="h-full w-[65%] rounded-full bg-gradient-to-r from-yellow-500 to-orange-400" />
              </div>

              <p className="mt-3 text-xs text-white/30">
                Continue jogando para subir de patente.
              </p>
            </div>

            {/* Estatísticas */}
            <div
              className="
                rounded-3xl border border-white/10
                bg-white/[0.03] p-7
              "
            >
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-white/30">
                Estatísticas
              </p>

              <div className="mt-6 grid grid-cols-2 gap-4">
                
                <div className="rounded-2xl bg-white/[0.03] p-4">
                  <div className="flex items-center gap-2 text-white/30">
                    <Gamepad2 size={15} />
                    <span className="text-xs">Partidas</span>
                  </div>

                  <p className="mt-2 text-2xl font-black">
                    24
                  </p>
                </div>

                <div className="rounded-2xl bg-white/[0.03] p-4">
                  <div className="flex items-center gap-2 text-white/30">
                    <Users size={15} />
                    <span className="text-xs">Vitórias</span>
                  </div>

                  <p className="mt-2 text-2xl font-black">
                    12
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Como funciona */}
        <div className="mt-10">
          <div className="mb-5">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/25">
              Como funciona
            </p>

            <h3 className="mt-2 text-xl font-bold">
              Prepare-se para a batalha
            </h3>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            
            <Step
              number="01"
              title="Digite o código"
              description="Receba o código da sala e informe acima para entrar."
            />

            <Step
              number="02"
              title="Responda"
              description="Responda às perguntas antes que o tempo acabe."
            />

            <Step
              number="03"
              title="Sobreviva"
              description="Evite ser eliminado e seja o último jogador de pé."
            />
          </div>
        </div>
      </section>
    </main>
  );
}

function Step({
  number,
  title,
  description,
}: {
  number: string;
  title: string;
  description: string;
}) {
  return (
    <div
      className="
        rounded-2xl border border-white/10
        bg-white/[0.025] p-6
        transition hover:border-purple-500/20
        hover:bg-purple-500/[0.03]
      "
    >
      <span className="text-xs font-black text-purple-400">
        {number}
      </span>

      <h4 className="mt-4 font-bold">
        {title}
      </h4>

      <p className="mt-2 text-sm leading-6 text-white/35">
        {description}
      </p>
    </div>
  );
}