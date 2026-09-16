"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BarChart3,
  Gamepad2,
  HelpCircle,
  LayoutDashboard,
  LogOut,
  Settings,
  Shield,
  Tags,
  Users,
  X,
} from "lucide-react";
import Cookies from "js-cookie";

interface SidebarProps {
  open?: boolean;
  onClose?: () => void;
}

const menuItems = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Patentes",
    href: "/dashboard/patente",
    icon: Shield,
  },
  {
    label: "Perguntas",
    href: "/dashboard/perguntas",
    icon: HelpCircle,
  },
  {
    label: "Temas",
    href: "/dashboard/temas",
    icon: Tags,
  },
  {
    label: "Jogadores",
    href: "/dashboard/jogadores",
    icon: Users,
  },
  {
    label: "Configurações",
    href: "/dashboard/configuracoes",
    icon: Settings,
  },
];

export default function MenuLateral({
  open = true,
  onClose,
}: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  function sair() {
    Cookies.remove("token");

    onClose?.();

    router.push("/login");
  }

  return (
    <>
      {/* Overlay mobile */}

      {open && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
        />
      )}

      {/* Sidebar */}

      <aside
        className={`
          fixed left-0 top-0 z-50 flex h-screen w-72 flex-col
          border-r border-indigo-500/10
          bg-[#080812]
          shadow-[8px_0_30px_rgba(0,0,0,0.15)]
          transition-transform duration-300
          ${open ? "translate-x-0" : "-translate-x-full"}
          lg:translate-x-0
        `}
      >

        {/* =========================
            LOGO
        ========================= */}

        <div className="flex h-20 items-center justify-between border-b border-white/5 px-6">

          <Link
            href="/dashboard/admin"
            className="flex items-center gap-3"
          >

            <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/20">

              <div className="absolute inset-0 rounded-xl bg-purple-500/20 blur-md" />

              <Shield className="relative h-5 w-5 text-white" />

            </div>

            <div>
              <h1 className="text-lg font-bold text-white">
                Quiz
                <span className="text-indigo-400">
                  Royale
                </span>
              </h1>

              <p className="text-xs text-zinc-500">
                Painel administrativo
              </p>
            </div>

          </Link>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-zinc-500 transition hover:bg-indigo-500/10 hover:text-indigo-300 lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>

        </div>

        {/* =========================
            PERFIL
        ========================= */}

        <div className="border-b border-white/5 p-5">

          <div className="rounded-xl border border-indigo-500/10 bg-gradient-to-r from-indigo-500/[0.06] to-purple-500/[0.04] p-3">

            <div className="flex items-center gap-3">

              <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 font-bold text-white shadow-lg shadow-indigo-500/10">

                A

              </div>

              <div className="min-w-0">

                <p className="truncate text-sm font-semibold text-white">
                  Administrador
                </p>

                <p className="truncate text-xs text-indigo-300/40">
                  Administrador
                </p>

              </div>

              <div className="ml-auto h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]" />

            </div>

          </div>

        </div>

        {/* =========================
            MENU
        ========================= */}

        <nav className="flex-1 space-y-1 overflow-y-auto p-4">

          <p className="mb-3 px-3 text-[11px] font-semibold uppercase tracking-wider text-indigo-300/30">
            Menu principal
          </p>

          {menuItems.map((item) => {

            const Icon = item.icon;

            const isActive =
              item.href === "/dashboard/admin"
                ? pathname === item.href
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={`
                  group relative flex items-center gap-3
                  rounded-xl px-3 py-3
                  text-sm font-medium
                  transition-all duration-200

                  ${
                    isActive
                      ? "bg-gradient-to-r from-indigo-500/15 to-purple-500/10 text-indigo-300 shadow-sm"
                      : "text-zinc-400 hover:bg-indigo-500/[0.06] hover:text-white"
                  }
                `}
              >

                {/* Indicador lateral */}

                {isActive && (
                  <span className="absolute left-0 h-6 w-0.5 rounded-full bg-gradient-to-b from-indigo-400 to-purple-500" />
                )}

                <Icon
                  className={`
                    h-5 w-5 transition-all duration-200

                    ${
                      isActive
                        ? "text-indigo-400"
                        : "text-zinc-500 group-hover:text-indigo-300"
                    }
                  `}
                />

                <span>
                  {item.label}
                </span>

                {isActive && (
                  <span className="ml-auto h-1.5 w-1.5 rounded-full bg-indigo-400 shadow-[0_0_8px_rgba(129,140,248,0.7)]" />
                )}

              </Link>
            );
          })}

          {/* Separador */}

          <div className="my-5 border-t border-white/5" />

          <p className="mb-3 px-3 text-[11px] font-semibold uppercase tracking-wider text-indigo-300/30">
            Sistema
          </p>

          {/* Área do jogador */}

          <Link
            href="/dashboard"
            onClick={onClose}
            className="group flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-zinc-400 transition-all hover:bg-purple-500/[0.06] hover:text-white"
          >

            <BarChart3 className="h-5 w-5 text-zinc-500 transition-colors group-hover:text-purple-300" />

            <span>
              Área do jogador
            </span>

          </Link>

        </nav>

        {/* =========================
            LOGOUT
        ========================= */}

        <div className="border-t border-white/5 p-4">

          <button
            type="button"
            onClick={sair}
            className="group flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-zinc-500 transition-all hover:bg-red-500/[0.07] hover:text-red-400"
          >

            <LogOut className="h-5 w-5 transition-colors group-hover:text-red-400" />

            <span>
              Sair da conta
            </span>

          </button>

        </div>

      </aside>
    </>
  );
}