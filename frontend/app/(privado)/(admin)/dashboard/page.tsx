"use client";

import { useState } from "react";
import Link from "next/link";
import {
  LayoutDashboard,
  Gamepad2,
  HelpCircle,
  Users,
  Tags,
  Settings,
  LogOut,
  Crown,
  Plus,
  ArrowUpRight,
  MoreHorizontal,
  Circle,
  Activity,
  Shield,
} from "lucide-react";

export default function AdminDashboard() {
  const [menuAberto, setMenuAberto] = useState(false);

  return (
    <main className="min-h-screen bg-[#080812] text-white">
      <div className="flex min-h-screen">

        
        {/* CONTEÚDO */}
        <section className="flex-1">

          {/* HEADER */}
          <header className="flex h-20 items-center justify-between border-b border-white/5 bg-[#080812]/80 px-6 backdrop-blur-xl lg:px-8">

            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-purple-400">
                Painel administrativo
              </p>

              <h2 className="mt-1 text-xl font-black">
                Dashboard
              </h2>
            </div>

            <div className="flex items-center gap-3">

              <button
                onClick={() => setMenuAberto(!menuAberto)}
                className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 transition hover:bg-white/[0.06]"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-500/10 text-purple-400">
                  <Shield size={16} />
                </div>

                <div className="hidden text-left sm:block">
                  <p className="text-xs font-bold">
                    Admin
                  </p>

                  <p className="text-[10px] text-white/25">
                    Administrador
                  </p>
                </div>
              </button>

              {menuAberto && (
                <div className="absolute right-6 top-16 z-50 w-44 rounded-xl border border-white/10 bg-[#12121e] p-2 shadow-2xl">
                  <button className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-white/60 hover:bg-white/5 hover:text-white">
                    <Settings size={15} />
                    Configurações
                  </button>

                  <button className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-red-400 hover:bg-red-500/5">
                    <LogOut size={15} />
                    Sair
                  </button>
                </div>
              )}
            </div>
          </header>

          {/* MAIN */}
          <div className="p-6 lg:p-8">

            {/* Saudação */}
            <div className="mb-8">
              <h3 className="text-2xl font-black">
                Visão geral
              </h3>

              <p className="mt-1 text-sm text-white/30">
                Acompanhe o estado do Quiz Royale.
              </p>
            </div>

            {/* ESTATÍSTICAS */}
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

              <StatCard
                icon={<Gamepad2 size={20} />}
                label="Salas criadas"
                value="18"
                change="+12%"
              />

              <StatCard
                icon={<Users size={20} />}
                label="Jogadores"
                value="146"
                change="+8%"
              />

              <StatCard
                icon={<HelpCircle size={20} />}
                label="Perguntas"
                value="324"
                change="+24%"
              />

              <StatCard
                icon={<Tags size={20} />}
                label="Temas"
                value="12"
                change="+5%"
              />

            </div>

            {/* GRID */}
            <div className="mt-6 grid gap-6 xl:grid-cols-[1.5fr_1fr]">

              {/* SALAS ATIVAS */}
              <div className="rounded-2xl border border-white/10 bg-white/[0.025]">

                <div className="flex items-center justify-between border-b border-white/5 p-6">
                  <div>
                    <h4 className="font-bold">
                      Salas recentes
                    </h4>

                    <p className="mt-1 text-xs text-white/25">
                      Últimas salas criadas
                    </p>
                  </div>

                  <Link
                    href="/dashboard/admin/salas"
                    className="text-xs font-bold text-purple-400 hover:text-purple-300"
                  >
                    Ver todas
                  </Link>
                </div>

                <div className="divide-y divide-white/5">

                  <RoomRow
                    name="Batalha de Matemática"
                    code="7K4P2A"
                    players="32"
                    status="Em andamento"
                  />

                  <RoomRow
                    name="Conhecimentos Gerais"
                    code="9X2M8B"
                    players="18"
                    status="Aguardando"
                  />

                  <RoomRow
                    name="Desafio de Tecnologia"
                    code="Q8L5Z1"
                    players="24"
                    status="Em andamento"
                  />

                  <RoomRow
                    name="História do Brasil"
                    code="M4T7K2"
                    players="0"
                    status="Finalizada"
                  />

                </div>
              </div>

              {/* AÇÕES */}
              <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-6">

                <div className="mb-6">
                  <h4 className="font-bold">
                    Ações rápidas
                  </h4>

                  <p className="mt-1 text-xs text-white/25">
                    Acesse rapidamente as principais funções.
                  </p>
                </div>

                <div className="space-y-3">

                  <QuickAction
                    icon={<Plus size={19} />}
                    title="Criar nova sala"
                    description="Iniciar uma nova batalha"
                    href="/dashboard/admin/salas/nova"
                  />

                  <QuickAction
                    icon={<HelpCircle size={19} />}
                    title="Nova pergunta"
                    description="Adicionar pergunta ao banco"
                    href="/dashboard/admin/perguntas/nova"
                  />

                  <QuickAction
                    icon={<Tags size={19} />}
                    title="Novo tema"
                    description="Criar categoria de perguntas"
                    href="/dashboard/admin/temas"
                  />

                </div>
              </div>
            </div>

            {/* ATIVIDADE */}
            <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.025]">

              <div className="border-b border-white/5 p-6">
                <div className="flex items-center gap-2">
                  <Activity size={18} className="text-purple-400" />

                  <h4 className="font-bold">
                    Atividade recente
                  </h4>
                </div>
              </div>

              <div className="divide-y divide-white/5">

                <ActivityRow
                  text="Sala criada"
                  detail="Batalha de Matemática"
                  time="há 5 minutos"
                />

                <ActivityRow
                  text="Nova pergunta adicionada"
                  detail="Conhecimentos Gerais"
                  time="há 18 minutos"
                />

                <ActivityRow
                  text="Sala finalizada"
                  detail="História do Brasil"
                  time="há 32 minutos"
                />

                <ActivityRow
                  text="Novo tema criado"
                  detail="Tecnologia"
                  time="há 1 hora"
                />

              </div>
            </div>

          </div>
        </section>
      </div>
    </main>
  );
}

/* SIDEBAR ITEM */

function SidebarItem({
  icon,
  label,
  active = false,
  href,
}: {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  href?: string;
}) {
  const content = (
    <div
      className={`
        mb-1 flex items-center gap-3 rounded-xl px-3 py-3
        text-sm font-medium transition
        ${
          active
            ? "bg-purple-500/10 text-purple-400"
            : "text-white/35 hover:bg-white/[0.04] hover:text-white"
        }
      `}
    >
      {icon}

      <span>{label}</span>
    </div>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }

  return content;
}

/* STAT CARD */

function StatCard({
  icon,
  label,
  value,
  change,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  change: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-5 transition hover:border-purple-500/20">

      <div className="flex items-start justify-between">

        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/10 text-purple-400">
          {icon}
        </div>

        <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-400">
          <ArrowUpRight size={12} />
          {change}
        </span>

      </div>

      <p className="mt-5 text-xs text-white/30">
        {label}
      </p>

      <p className="mt-1 text-2xl font-black">
        {value}
      </p>

    </div>
  );
}

/* ROOM ROW */

function RoomRow({
  name,
  code,
  players,
  status,
}: {
  name: string;
  code: string;
  players: string;
  status: string;
}) {
  const andamento = status === "Em andamento";
  const aguardando = status === "Aguardando";

  return (
    <div className="flex items-center justify-between gap-4 p-5 transition hover:bg-white/[0.02]">

      <div className="flex min-w-0 items-center gap-4">

        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400">
          <Gamepad2 size={18} />
        </div>

        <div className="min-w-0">
          <p className="truncate text-sm font-bold">
            {name}
          </p>

          <p className="mt-1 text-[11px] font-bold tracking-widest text-purple-400">
            {code}
          </p>
        </div>

      </div>

      <div className="hidden items-center gap-6 sm:flex">

        <div className="flex items-center gap-2 text-xs text-white/30">
          <Users size={14} />
          {players}
        </div>

        <div className="flex items-center gap-2 text-xs">
          <Circle
            size={8}
            fill="currentColor"
            className={
              andamento
                ? "text-emerald-400"
                : aguardando
                  ? "text-yellow-400"
                  : "text-white/20"
            }
          />

          <span className="text-white/40">
            {status}
          </span>
        </div>

        <button className="text-white/20 hover:text-white">
          <MoreHorizontal size={18} />
        </button>

      </div>
    </div>
  );
}

/* QUICK ACTION */

function QuickAction({
  icon,
  title,
  description,
  href,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-4 rounded-xl border border-white/5 bg-white/[0.02] p-4 transition hover:border-purple-500/20 hover:bg-purple-500/[0.04]"
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-500/10 text-purple-400">
        {icon}
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold">
          {title}
        </p>

        <p className="mt-1 truncate text-xs text-white/25">
          {description}
        </p>
      </div>

      <ArrowUpRight
        size={16}
        className="text-white/20"
      />
    </Link>
  );
}

/* ACTIVITY */

function ActivityRow({
  text,
  detail,
  time,
}: {
  text: string;
  detail: string;
  time: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 p-5">

      <div className="flex items-center gap-3">

        <div className="h-2 w-2 rounded-full bg-purple-400" />

        <div>
          <p className="text-sm font-medium">
            {text}
          </p>

          <p className="mt-1 text-xs text-white/25">
            {detail}
          </p>
        </div>

      </div>

      <span className="shrink-0 text-[10px] text-white/20">
        {time}
      </span>

    </div>
  );
}

