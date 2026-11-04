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
  AlertTriangle,
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
  const [modalSairAberto, setModalSairAberto] = useState(false);

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

  // =========================================================
  // MODAL DE SAÍDA
  // =========================================================

  function abrirModalSair() {
    setModalSairAberto(true);
  }

  function fecharModalSair() {
    setModalSairAberto(false);
  }

  function confirmarSaida() {
    setModalSairAberto(false);
    router.push("/");
  }

  useEffect(() => {
    if (!modalSairAberto) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        fecharModalSair();
      }
    }

    const overflowAnterior = document.body.style.overflow;

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = overflowAnterior;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [modalSairAberto]);

  const nomeExibido = carregandoUsuario
    ? "Carregando perfil..."
    : usuario?.nome || "Administrador";

  const inicial =
    usuario?.nome?.trim()?.charAt(0)?.toUpperCase() || "A";

  return (
    <>
      {/* OVERLAY MOBILE */}

      {open && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
        />
      )}

      {/* SIDEBAR */}

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
            onClick={abrirModalSair}
            className="group flex w-full cursor-pointer items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-zinc-500 transition-all hover:bg-red-500/[0.07] hover:text-red-400"
          >
            <LogOut className="h-5 w-5 transition-colors group-hover:text-red-400" />

            <span>Sair do painel</span>
          </button>
        </div>
      </aside>

      {/* MODAL DE CONFIRMAÇÃO */}

      {modalSairAberto && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              fecharModalSair();
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="titulo-modal-sair"
            className="w-full max-w-md overflow-hidden rounded-2xl border border-white/10 bg-[#10101d] shadow-[0_25px_80px_rgba(0,0,0,0.6)] animate-in fade-in zoom-in-95 duration-200"
          >
            {/* CABEÇALHO */}

            <div className="relative border-b border-white/5 px-6 pb-5 pt-6">
              <button
                type="button"
                onClick={fecharModalSair}
                aria-label="Fechar modal"
                className="absolute right-4 top-4 rounded-lg p-2 text-white/30 transition hover:bg-white/5 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>

              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-red-400/20 bg-red-500/10">
                <LogOut className="h-5 w-5 text-red-400" />
              </div>

              <h2
                id="titulo-modal-sair"
                className="text-lg font-bold text-white"
              >
                Sair do painel?
              </h2>

              <p className="mt-2 text-sm leading-relaxed text-zinc-400">
                Tem certeza de que deseja sair da dashboard?
                Você será redirecionado para a página inicial.
              </p>
            </div>

            {/* AÇÕES */}

            <div className="flex flex-col-reverse gap-2 p-5 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={fecharModalSair}
                className="rounded-xl border border-white/10 bg-white/[0.03] px-5 py-3 text-sm font-semibold text-zinc-300 transition hover:bg-white/[0.07] hover:text-white"
              >
                Continuar no painel
              </button>

              <button
                type="button"
                onClick={confirmarSaida}
                className="flex items-center justify-center gap-2 rounded-xl border border-red-400/20 bg-red-500/10 px-5 py-3 text-sm font-semibold text-red-300 transition hover:border-red-400/40 hover:bg-red-500/20 hover:text-red-200"
              >
                <LogOut className="h-4 w-4" />
                Sim, quero sair
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
