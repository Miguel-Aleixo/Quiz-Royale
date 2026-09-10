"use client";

import Link from "next/link";
import {
  ArrowLeft,
  Crown,
  Trophy,
  Gamepad2,
  Target,
  Medal,
  Shield,
  Mail,
  User,
  CalendarDays,
  Settings,
  ChevronRight,
} from "lucide-react";

export default function PerfilPage() {
  return (
    <main className="min-h-screen bg-[#080812] text-white">
      {/* Background */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-[-250px] h-[550px] w-[550px] -translate-x-1/2 rounded-full bg-purple-700/20 blur-[140px]" />
        <div className="absolute bottom-[-250px] right-[-150px] h-[500px] w-[500px] rounded-full bg-indigo-700/10 blur-[130px]" />
      </div>

      {/* HEADER */}
      <header className="relative z-10 border-b border-white/5 bg-[#080812]/80 backdrop-blur-xl">
        <div className="mx-auto flex h-20 max-w-6xl items-center justify-between px-6">

          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] text-white/40 transition hover:bg-white/[0.06] hover:text-white"
            >
              <ArrowLeft size={18} />
            </Link>

            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-purple-400">
                Quiz Royale
              </p>

              <h1 className="text-lg font-black">
                Meu perfil
              </h1>
            </div>
          </div>

          <button
            className="flex h-10 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-4 text-xs font-bold text-white/50 transition hover:bg-white/[0.06] hover:text-white"
          >
            <Settings size={16} />
            <span className="hidden sm:inline">
              Configurações
            </span>
          </button>
        </div>
      </header>

      {/* CONTEÚDO */}
      <section className="relative z-10 mx-auto max-w-6xl px-6 py-10">

        {/* PERFIL PRINCIPAL */}
        <div className="overflow-hidden rounded-3xl border border-white/10 bg-[#10101c]/90 shadow-2xl">

          {/* Banner */}
          <div className="relative h-40 overflow-hidden bg-gradient-to-r from-purple-900/40 via-indigo-900/30 to-blue-900/20">
            <div className="absolute left-1/2 top-[-180px] h-96 w-96 -translate-x-1/2 rounded-full bg-purple-500/20 blur-3xl" />

            <div className="absolute bottom-4 right-6 flex items-center gap-2 rounded-full border border-white/10 bg-black/20 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-white/40 backdrop-blur">
              <Shield size={12} />
              Jogador
            </div>
          </div>

          {/* Dados */}
          <div className="relative px-6 pb-7 sm:px-8">

            {/* Avatar */}
            <div className="-mt-14 flex h-28 w-28 items-center justify-center rounded-3xl border-4 border-[#10101c] bg-gradient-to-br from-purple-600 to-indigo-600 shadow-xl shadow-purple-900/30">
              <User size={48} />
            </div>

            <div className="mt-5 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">

              <div>
                <h2 className="text-3xl font-black">
                  Miguel
                </h2>

                <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-white/30">
                  <span className="flex items-center gap-2">
                    <Mail size={14} />
                    miguel@email.com
                  </span>

                  <span className="hidden text-white/10 sm:block">
                    •
                  </span>

                  <span className="flex items-center gap-2">
                    <CalendarDays size={14} />
                    Membro desde 2026
                  </span>
                </div>
              </div>

              <button className="flex h-10 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-4 text-xs font-bold text-white/50 transition hover:border-purple-500/20 hover:bg-purple-500/5 hover:text-white">
                Editar perfil
                <ChevronRight size={15} />
              </button>
            </div>
          </div>
        </div>

        {/* PATENTE + ESTATÍSTICAS */}
        <div className="mt-6 grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">

          {/* PATENTE */}
          <div className="rounded-3xl border border-white/10 bg-white/[0.025] p-7">

            <div className="flex items-start justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/25">
                  Patente atual
                </p>

                <h3 className="mt-2 text-3xl font-black">
                  Bronze
                </h3>
              </div>

              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-yellow-500/10 text-yellow-400">
                <Crown size={27} />
              </div>
            </div>

            {/* Progresso */}
            <div className="mt-8">
              <div className="mb-2 flex justify-between text-xs">
                <span className="text-white/30">
                  Progresso
                </span>

                <span className="font-bold text-purple-400">
                  650 / 1000
                </span>
              </div>

              <div className="h-2 overflow-hidden rounded-full bg-white/5">
                <div className="h-full w-[65%] rounded-full bg-gradient-to-r from-yellow-500 to-orange-400" />
              </div>

              <p className="mt-3 text-xs text-white/20">
                Faltam 350 pontos para a próxima patente.
              </p>
            </div>

            {/* Próxima patente */}
            <div className="mt-7 flex items-center gap-3 rounded-2xl border border-white/5 bg-white/[0.02] p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 text-white/30">
                <Medal size={18} />
              </div>

              <div>
                <p className="text-xs text-white/30">
                  Próxima patente
                </p>

                <p className="mt-1 text-sm font-bold">
                  Prata
                </p>
              </div>
            </div>
          </div>

          {/* ESTATÍSTICAS */}
          <div className="rounded-3xl border border-white/10 bg-white/[0.025] p-7">

            <div className="mb-6">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/25">
                Desempenho
              </p>

              <h3 className="mt-2 text-xl font-black">
                Suas estatísticas
              </h3>
            </div>

            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">

              <ProfileStat
                icon={<Gamepad2 size={19} />}
                value="24"
                label="Partidas"
              />

              <ProfileStat
                icon={<Trophy size={19} />}
                value="12"
                label="Vitórias"
              />

              <ProfileStat
                icon={<Target size={19} />}
                value="78%"
                label="Acerto"
              />

              <ProfileStat
                icon={<Medal size={19} />}
                value="#18"
                label="Ranking"
              />

            </div>
          </div>
        </div>

        {/* HISTÓRICO */}
        <div className="mt-6 rounded-3xl border border-white/10 bg-white/[0.025]">

          <div className="flex items-center justify-between border-b border-white/5 p-6">

            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/25">
                Histórico
              </p>

              <h3 className="mt-2 text-xl font-black">
                Partidas recentes
              </h3>
            </div>

            <button className="text-xs font-bold text-purple-400 transition hover:text-purple-300">
              Ver tudo
            </button>
          </div>

          <div className="divide-y divide-white/5">

            <Match
              name="Batalha de Matemática"
              date="Hoje, 14:30"
              position="1º lugar"
              result="Vitória"
            />

            <Match
              name="Conhecimentos Gerais"
              date="Ontem, 19:20"
              position="4º lugar"
              result="Eliminado"
            />

            <Match
              name="Desafio de Tecnologia"
              date="08/09/2026"
              position="2º lugar"
              result="Vitória"
            />

            <Match
              name="História do Brasil"
              date="06/09/2026"
              position="7º lugar"
              result="Eliminado"
            />

          </div>
        </div>

        {/* CONQUISTAS */}
        <div className="mt-6">

          <div className="mb-5">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/25">
              Conquistas
            </p>

            <h3 className="mt-2 text-xl font-black">
              Suas conquistas
            </h3>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

            <Achievement
              icon={<Trophy size={21} />}
              title="Primeira vitória"
              description="Vença sua primeira partida"
              unlocked
            />

            <Achievement
              icon={<Crown size={21} />}
              title="Campeão"
              description="Termine uma partida em 1º lugar"
              unlocked
            />

            <Achievement
              icon={<Target size={21} />}
              title="Precisão"
              description="Acumule 90% de acerto"
            />

            <Achievement
              icon={<Medal size={21} />}
              title="Veterano"
              description="Jogue 50 partidas"
            />

          </div>
        </div>
      </section>
    </main>
  );
}

/* ESTATÍSTICA */

function ProfileStat({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode;
  value: string;
  label: string;
}) {
  return (
    <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-5">

      <div className="mb-4 flex h-9 w-9 items-center justify-center rounded-lg bg-purple-500/10 text-purple-400">
        {icon}
      </div>

      <p className="text-2xl font-black">
        {value}
      </p>

      <p className="mt-1 text-xs text-white/25">
        {label}
      </p>
    </div>
  );
}

/* PARTIDA */

function Match({
  name,
  date,
  position,
  result,
}: {
  name: string;
  date: string;
  position: string;
  result: string;
}) {
  const venceu = result === "Vitória";

  return (
    <div className="flex items-center justify-between gap-4 p-5 transition hover:bg-white/[0.02]">

      <div className="flex min-w-0 items-center gap-4">

        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
            venceu
              ? "bg-emerald-500/10 text-emerald-400"
              : "bg-red-500/10 text-red-400"
          }`}
        >
          {venceu ? (
            <Trophy size={18} />
          ) : (
            <Gamepad2 size={18} />
          )}
        </div>

        <div className="min-w-0">
          <p className="truncate text-sm font-bold">
            {name}
          </p>

          <p className="mt-1 text-xs text-white/25">
            {date}
          </p>
        </div>
      </div>

      <div className="hidden items-center gap-8 sm:flex">

        <div className="text-right">
          <p className="text-xs text-white/25">
            Colocação
          </p>

          <p className="mt-1 text-sm font-bold">
            {position}
          </p>
        </div>

        <span
          className={`rounded-full px-3 py-1.5 text-[10px] font-bold ${
            venceu
              ? "bg-emerald-500/10 text-emerald-400"
              : "bg-red-500/10 text-red-400"
          }`}
        >
          {result}
        </span>
      </div>
    </div>
  );
}

/* CONQUISTA */

function Achievement({
  icon,
  title,
  description,
  unlocked = false,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  unlocked?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border p-5 ${
        unlocked
          ? "border-purple-500/20 bg-purple-500/[0.04]"
          : "border-white/5 bg-white/[0.02] opacity-40"
      }`}
    >
      <div
        className={`flex h-11 w-11 items-center justify-center rounded-xl ${
          unlocked
            ? "bg-purple-500/10 text-purple-400"
            : "bg-white/5 text-white/30"
        }`}
      >
        {icon}
      </div>

      <h4 className="mt-4 text-sm font-bold">
        {title}
      </h4>

      <p className="mt-2 text-xs leading-5 text-white/25">
        {description}
      </p>

      {unlocked && (
        <p className="mt-3 text-[10px] font-bold uppercase tracking-wider text-purple-400">
          Desbloqueada
        </p>
      )}
    </div>
  );
}

