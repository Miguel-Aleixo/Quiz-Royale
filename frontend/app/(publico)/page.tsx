"use client";

import { useState } from "react";
import {
  ArrowRight,
  Crown,
  Gamepad2,
  LogOut,
  Shield,
  Sparkles,
  Swords,
  Trophy,
  User,
  Users,
} from "lucide-react";
import { useBuscarUsuario } from "../hooks/useBuscarUsuario";

export default function Home() {
  const [codigo, setCodigo] = useState("");

  const { usuario, loading, error } = useBuscarUsuario();

  function entrarNaSala() {
    if (!codigo.trim()) return;
    console.log("Entrando na sala:", codigo);
  }

  return (
    <main className="min-h-screen overflow-hidden bg-[#070812] text-white selection:bg-fuchsia-400 selection:text-white">
      {/* Background atmosférico */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute left-1/2 top-[-24rem] h-[48rem] w-[48rem] -translate-x-1/2 rounded-full bg-violet-700/20 blur-[10rem]" />
        <div className="absolute -bottom-72 -left-56 h-[42rem] w-[42rem] rounded-full bg-fuchsia-700/10 blur-[9rem]" />
        <div className="absolute right-[-18rem] top-1/4 h-[38rem] w-[38rem] rounded-full bg-indigo-600/10 blur-[9rem]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.06),transparent_34%)]" />
        <div className="absolute inset-0 opacity-[0.025] [background-image:linear-gradient(rgba(255,255,255,0.8)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.8)_1px,transparent_1px)] [background-size:44px_44px]" />
      </div>

      {/* Navbar */}
      <header className="relative z-10 border-b border-white/[0.08] bg-[#070812]/70 backdrop-blur-2xl">
        <div className="mx-auto flex h-[76px] max-w-7xl items-center justify-between px-5 sm:px-8">
          <div className="flex items-center gap-3">
            <div className="relative flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 via-fuchsia-600 to-orange-400 shadow-lg shadow-fuchsia-950/30">
              <div className="absolute inset-0 rounded-2xl bg-white/10" />
              <Crown size={22} strokeWidth={2.4} className="relative" />
            </div>
            <div>
              <h1 className="text-[17px] font-black tracking-tight">QUIZ <span className="text-violet-300">ROYALE</span></h1>
              <p className="text-[9px] font-bold uppercase tracking-[0.22em] text-white/35">Battle of Knowledge</p>
            </div>
          </div>

          <div className="flex items-center gap-3 sm:gap-4">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-bold">{usuario ? usuario?.nome : ''}</p>
              <p className="mt-0.5 text-[11px] font-medium text-violet-300">{usuario ? usuario?.patenteId : ''}</p>
            </div>
            <button aria-label="Abrir perfil" className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.06] text-white/70 transition hover:border-violet-400/40 hover:bg-violet-500/10 hover:text-white focus:outline-none focus:ring-2 focus:ring-violet-400">
              <User size={18} />
            </button>
            <button aria-label="Sair" className="hidden h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-white/45 transition hover:border-red-400/40 hover:bg-red-500/10 hover:text-red-300 focus:outline-none focus:ring-2 focus:ring-red-400 sm:flex">
              <LogOut size={17} />
            </button>
          </div>
        </div>
      </header>

      {/* Conteúdo */}
      <section className="relative z-10 mx-auto max-w-7xl px-5 py-10 sm:px-8 sm:py-14">
        {/* Hero */}
        <div className="mb-10 flex flex-col justify-between gap-7 lg:flex-row lg:items-end">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-violet-400/20 bg-violet-400/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-violet-200">
              <Sparkles size={13} />
              Arena online
            </div>
            <h2 className="max-w-3xl text-4xl font-black leading-[1.02] tracking-[-0.04em] sm:text-5xl lg:text-6xl">
              Pronto para o
              <span className="block bg-gradient-to-r from-violet-300 via-fuchsia-300 to-orange-300 bg-clip-text text-transparent">próximo desafio?</span>
            </h2>
            <p className="mt-5 max-w-xl text-sm leading-7 text-white/45">Entre em uma sala, teste seus conhecimentos e dispute a batalha pelo topo do ranking.</p>
          </div>
          <div className="hidden rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-4 text-right lg:block">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/35">Temporada atual</p>
            <p className="mt-1 text-lg font-black text-white">Reis do conhecimento</p>
          </div>
        </div>

        {/* Área principal */}
        <div className="grid gap-6 lg:grid-cols-[1.45fr_0.9fr]">
          <section className="group relative overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-[#19152d] via-[#121124] to-[#0c0d19] p-6 shadow-2xl shadow-black/30 sm:p-8">
            <div className="absolute -right-28 -top-32 h-80 w-80 rounded-full bg-fuchsia-600/15 blur-[5rem] transition duration-700 group-hover:bg-fuchsia-500/20" />
            <div className="absolute bottom-[-7rem] left-[-5rem] h-56 w-56 rounded-full bg-violet-600/10 blur-[5rem]" />
            <div className="relative">
              <div className="mb-7 flex items-center justify-between">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500/20 to-fuchsia-500/10 text-violet-300 ring-1 ring-violet-400/25">
                  <Swords size={26} />
                </div>
                <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.15em] text-emerald-300">Salas abertas</span>
              </div>
              <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.2em] text-violet-300">Entrar na batalha</p>
              <h3 className="text-3xl font-black tracking-tight sm:text-4xl">Digite o código da sala</h3>
              <p className="mt-3 max-w-lg text-sm leading-6 text-white/40">Insira o código de acesso fornecido pelo administrador da partida para começar.</p>

              <form onSubmit={(e) => { e.preventDefault(); entrarNaSala(); }} className="mt-8">
                <label htmlFor="codigo" className="mb-2 block text-[10px] font-bold uppercase tracking-[0.16em] text-white/40">Código da sala</label>
                <div className="flex flex-col gap-3 sm:flex-row">
                  <input id="codigo" type="text" maxLength={10} value={codigo} onChange={(e) => setCodigo(e.target.value.toUpperCase())} placeholder="EX: 8K4P2A" className="h-14 min-w-0 flex-1 rounded-2xl border border-white/10 bg-black/25 px-5 text-center text-lg font-black tracking-[0.25em] text-white outline-none transition placeholder:text-white/15 hover:border-white/20 focus:border-fuchsia-400/70 focus:bg-black/35 focus:ring-4 focus:ring-fuchsia-400/10" />
                  <button type="submit" disabled={!codigo.trim()} className="group flex h-14 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-violet-600 via-fuchsia-600 to-orange-500 px-7 font-bold shadow-xl shadow-fuchsia-950/30 transition hover:-translate-y-0.5 hover:shadow-fuchsia-900/50 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0">
                    Entrar <ArrowRight size={18} className="transition group-hover:translate-x-1" />
                  </button>
                </div>
              </form>

              <div className="mt-7 flex items-center gap-2 text-xs text-white/30"><Shield size={14} className="text-emerald-400/80" /><span>O código é fornecido pelo administrador da sala.</span></div>
            </div>
          </section>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-1">
            <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.045] p-6 shadow-xl shadow-black/10 sm:p-7">
              <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-amber-400/10 blur-3xl" />
              <div className="relative flex items-start justify-between"><div><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/35">Sua patente</p><h3 className="mt-2 text-3xl font-black">Bronze</h3></div><div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-400/10 text-amber-300 ring-1 ring-amber-300/10"><Trophy size={23} /></div></div>
              <div className="mt-7 h-2 overflow-hidden rounded-full bg-white/10"><div className="h-full w-[65%] rounded-full bg-gradient-to-r from-amber-500 to-orange-400 shadow-[0_0_14px_rgba(251,191,36,0.35)]" /></div>
              <div className="mt-3 flex justify-between text-[11px] text-white/30"><span>Progresso</span><span>65%</span></div>
            </section>

            <section className="rounded-[2rem] border border-white/10 bg-white/[0.045] p-6 shadow-xl shadow-black/10 sm:p-7">
              <div className="flex items-center justify-between"><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/35">Estatísticas</p><span className="text-[10px] font-semibold text-violet-300">Últimos 30 dias</span></div>
              <div className="mt-6 grid grid-cols-2 gap-3">
                <Stat icon={<Gamepad2 size={15} />} label="Partidas" value="24" accent="text-violet-300" />
                <Stat icon={<Users size={15} />} label="Vitórias" value="12" accent="text-fuchsia-300" />
              </div>
            </section>
          </div>
        </div>

        {/* Passos */}
        <div className="mt-12">
          <div className="mb-5 flex items-end justify-between"><div><p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/30">Como funciona</p><h3 className="mt-2 text-2xl font-black tracking-tight">Prepare-se para a batalha</h3></div><span className="hidden text-xs text-white/25 sm:block">3 passos simples</span></div>
          <div className="grid gap-4 md:grid-cols-3"><Step number="01" title="Digite o código" description="Receba o código da sala e informe acima para entrar." /><Step number="02" title="Responda" description="Responda às perguntas antes que o tempo acabe." /><Step number="03" title="Sobreviva" description="Evite ser eliminado e seja o último jogador de pé." /></div>
        </div>
      </section>
    </main>
  );
}

function Stat({ icon, label, value, accent }: { icon: React.ReactNode; label: string; value: string; accent: string }) {
  return <div className="rounded-2xl border border-white/[0.06] bg-black/10 p-4"><div className="flex items-center gap-2 text-white/35">{icon}<span className="text-xs">{label}</span></div><p className={`mt-2 text-3xl font-black ${accent}`}>{value}</p></div>;
}

function Step({ number, title, description }: { number: string; title: string; description: string }) {
  return <div className="group rounded-[1.5rem] border border-white/10 bg-white/[0.035] p-6 transition hover:-translate-y-1 hover:border-violet-400/30 hover:bg-violet-500/[0.06]"><div className="flex items-center justify-between"><span className="text-xs font-black text-violet-300">{number}</span><ArrowRight size={16} className="text-white/20 transition group-hover:translate-x-1 group-hover:text-violet-300" /></div><h4 className="mt-6 font-bold">{title}</h4><p className="mt-2 text-sm leading-6 text-white/35">{description}</p></div>;
}
