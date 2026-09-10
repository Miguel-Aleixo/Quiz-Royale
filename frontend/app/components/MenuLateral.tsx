"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
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
    label: "Salas",
    href: "/dashboard/salas",
    icon: Gamepad2,
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

  return (
    <>
      {/* Overlay mobile */}
      {open && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
        />
      )}

      <aside
        className={`
          fixed left-0 top-0 z-50 flex h-screen w-72 flex-col
          border-r border-white/10 bg-[#09090f]
          transition-transform duration-300
          ${open ? "translate-x-0" : "-translate-x-full"}
          lg:translate-x-0
        `}
      >
        {/* Logo */}
        <div className="flex h-20 items-center justify-between border-b border-white/10 px-6">
          <Link
            href="/dashboard/admin"
            className="flex items-center gap-3"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/20">
              <Shield className="h-5 w-5 text-white" />
            </div>

            <div>
              <h1 className="text-lg font-bold text-white">
                Quiz<span className="text-indigo-400">Royale</span>
              </h1>

              <p className="text-xs text-zinc-500">
                Painel administrativo
              </p>
            </div>
          </Link>

          <button
            onClick={onClose}
            className="rounded-lg p-2 text-zinc-400 hover:bg-white/5 hover:text-white lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Perfil */}
        <div className="border-b border-white/10 p-5">
          <div className="flex items-center gap-3 rounded-xl bg-white/[0.03] p-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 font-bold text-white">
              A
            </div>

            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-white">
                Administrador
              </p>

              <p className="truncate text-xs text-zinc-500">
                Administrador
              </p>
            </div>

            <div className="ml-auto h-2 w-2 rounded-full bg-emerald-400" />
          </div>
        </div>

        {/* Menu */}
        <nav className="flex-1 space-y-1 overflow-y-auto p-4">
          <p className="mb-3 px-3 text-[11px] font-semibold uppercase tracking-wider text-zinc-600">
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
                  group flex items-center gap-3 rounded-xl px-3 py-3
                  text-sm font-medium transition-all
                  ${
                    isActive
                      ? "bg-indigo-500/10 text-indigo-400"
                      : "text-zinc-400 hover:bg-white/[0.04] hover:text-white"
                  }
                `}
              >
                <Icon
                  className={`
                    h-5 w-5 transition-colors
                    ${
                      isActive
                        ? "text-indigo-400"
                        : "text-zinc-500 group-hover:text-zinc-300"
                    }
                  `}
                />

                <span>{item.label}</span>

                {isActive && (
                  <span className="ml-auto h-2 w-2 rounded-full bg-indigo-400" />
                )}
              </Link>
            );
          })}

          <div className="my-5 border-t border-white/5" />

          <p className="mb-3 px-3 text-[11px] font-semibold uppercase tracking-wider text-zinc-600">
            Sistema
          </p>

          <Link
            href="/dashboard"
            className="group flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-zinc-400 transition-all hover:bg-white/[0.04] hover:text-white"
          >
            <BarChart3 className="h-5 w-5 text-zinc-500 group-hover:text-zinc-300" />

            <span>Área do jogador</span>
          </Link>
        </nav>

        {/* Logout */}
        <div className="border-t border-white/10 p-4">
          <button
            className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-zinc-400 transition-all hover:bg-red-500/10 hover:text-red-400"
          >
            <LogOut className="h-5 w-5" />

            <span>Sair da conta</span>
          </button>
        </div>
      </aside>
    </>
  );
}