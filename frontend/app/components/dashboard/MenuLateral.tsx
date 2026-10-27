
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
} from "lucide-react";
import Cookies from "js-cookie";
import Image from "next/image";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface SidebarProps {
  open?: boolean;
  onClose?: () => void;
}

interface Usuario {
  id: number;
  nome: string;
  email?: string;
  role?: string;
}

interface TokenPayload {
  sub?: number | string;
  id?: number | string;
  role?: string;
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
    label: "Temas",
    href: "/dashboard/temas",
    icon: Tags,
  },
  {
    label: "Perguntas",
    href: "/dashboard/perguntas",
    icon: HelpCircle,
  },
  {
    label: "Jogadores",
    href: "/dashboard/jogadores",
    icon: Users,
  },
];

export default function MenuLateral({
  open = true,
  onClose,
}: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const API = process.env.NEXT_PUBLIC_API;

  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [carregandoUsuario, setCarregandoUsuario] = useState(true);

  useEffect(() => {
    let ativo = true;

    async function buscarUsuario() {
      const token = Cookies.get("token");

      if (!token || !API) {
        if (ativo) {
          setCarregandoUsuario(false);
        }
        return;
      }

      try {
        const parteToken = token.split(".")[1];

        if (!parteToken) {
          throw new Error("Token inválido.");
        }

        const base64 = parteToken
          .replace(/-/g, "+")
          .replace(/_/g, "/")
          .padEnd(
            parteToken.length +
              ((4 - (parteToken.length % 4)) % 4),
            "="
          );

        const payload = JSON.parse(
          atob(base64)
        ) as TokenPayload;

        const usuarioId = payload.sub ?? payload.id;

        if (usuarioId === undefined || usuarioId === null) {
          throw new Error(
            "Não foi possível identificar o usuário no token."
          );
        }

        const resposta = await fetch(
          `${API}/usuario/${encodeURIComponent(String(usuarioId))}`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            cache: "no-store",
          }
        );

        if (!resposta.ok) {
          throw new Error(
            "Não foi possível carregar os dados do administrador."
          );
        }

        const dados = (await resposta.json()) as Usuario;

        if (ativo) {
          setUsuario(dados);
        }
      } catch (erro) {
        console.error(
          "Erro ao buscar perfil do administrador:",
          erro
        );
      } finally {
        if (ativo) {
          setCarregandoUsuario(false);
        }
      }
    }

    buscarUsuario();

    return () => {
      ativo = false;
    };
  }, [API]);

  function sair() {
    router.push("/");
  }

  const nomeExibido = carregandoUsuario
    ? "Carregando perfil..."
    : usuario?.nome || "Administrador";

  const inicial = usuario?.nome?.trim()?.charAt(0)?.toUpperCase() || "A";

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
        {/* LOGO */}
        <div className="flex h-20 items-center justify-between border-b border-white/5 px-3">
          <Image
            src="/imagens/logo_dark.png"
            alt="Logo Quiz Royale"
            width={175}
            height={175}
            priority
            className="h-[175px] w-[175px] object-contain"
          />
        </div>

        {/* PERFIL CLICÁVEL */}
        <div className="border-b border-white/5 p-5">
          <Link
            href="/perfil"
            onClick={onClose}
            aria-label="Abrir meu perfil"
            className="group block rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
          >
            <div className="rounded-xl border border-indigo-500/10 bg-gradient-to-r from-indigo-500/[0.06] to-purple-500/[0.04] p-3 transition-all duration-200 group-hover:border-indigo-400/30 group-hover:from-indigo-500/10 group-hover:to-purple-500/[0.08]">
              <div className="flex items-center gap-3">
                <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 font-bold text-white shadow-lg shadow-indigo-500/10 transition-transform group-hover:scale-105">
                  {inicial}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-white">
                    {nomeExibido}
                  </p>

                  <p className="truncate text-xs text-indigo-300/60">
                    {usuario?.role === "ADMIN"
                      ? "Administrador"
                      : usuario?.role || "Conta"}
                  </p>
                </div>

                <div className="h-2 w-2 shrink-0 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]" />
              </div>
            </div>
          </Link>
        </div>

        {/* MENU */}
        <nav className="flex-1 space-y-1 overflow-y-auto p-4">
          <p className="mb-3 px-3 text-[11px] font-semibold uppercase tracking-wider text-indigo-300/30">
            Menu principal
          </p>

          {menuItems.map((item) => {
            const Icon = item.icon;

            const isActive =
              item.href === "/dashboard"
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

                <span>{item.label}</span>

                {isActive && (
                  <span className="ml-auto h-1.5 w-1.5 rounded-full bg-indigo-400 shadow-[0_0_8px_rgba(129,140,248,0.7)]" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* SAIR */}
        <div className="border-t border-white/5 p-4">
          <button
            type="button"
            onClick={sair}
            className="group flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-zinc-500 transition-all hover:bg-red-500/[0.07] hover:text-red-400"
          >
            <LogOut className="h-5 w-5 transition-colors group-hover:text-red-400" />

            <span>Sair do painel</span>
          </button>
        </div>
      </aside>
    </>
  );
}
