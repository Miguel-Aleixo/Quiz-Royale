"use client";

import Image from "next/image";
import {
  LayoutDashboard,
  LogIn,
  LogOut,
  User,
  Sparkles,
} from "lucide-react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import { useEffect, useState } from "react";

import LoadingOverlay from "../global/Loading";
import { useToken } from "@/app/hooks/usuario/useToken";

interface HeaderProps {
  nome?: string;
  patente?: string;
}

export default function Header({ nome, patente }: HeaderProps) {
  const router = useRouter();
  const usuario = useToken();

  const [token, setToken] = useState<string | undefined>(undefined);
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(false);

  const ehAdmin = usuario?.role === "ADMIN";
  const nomeExibicao = nome?.trim() || "Jogador";
  const inicial = nomeExibicao.charAt(0).toUpperCase();

  useEffect(() => {
    setToken(Cookies.get("token"));
    setMounted(true);
  }, []);

  function navegar(caminho: string) {
    setLoading(true);
    router.push(caminho);
  }

  function logout() {
    setLoading(true);
    Cookies.remove("token");
    setToken(undefined);
    router.push("/login");
  }

  return (
    <>
      <LoadingOverlay show={loading} />

      <header className="fixed inset-x-0 top-0 z-50 px-3 pt-3 sm:px-5 sm:pt-5">
        <div className="mx-auto max-w-[1320px]">
          <nav className="relative flex h-[68px] items-center justify-between overflow-hidden rounded-[22px] border border-white/[0.09] bg-[#101221]/85 px-3 shadow-[0_18px_55px_rgba(0,0,0,.28)] backdrop-blur-2xl sm:h-[74px] sm:rounded-3xl sm:px-5">
            {/* Brilhos sutis no mesmo estilo da página inicial */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -left-12 -top-16 h-36 w-36 rounded-full bg-fuchsia-500/[0.12] blur-3xl"
            />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute right-[22%] top-[-5rem] h-32 w-32 rounded-full bg-cyan-400/[0.08] blur-3xl"
            />

            {/* Logo */}
            <button
              type="button"
              onClick={() => navegar("/")}
              disabled={loading}
              aria-label="Ir para a página inicial"
              className="group relative z-10 flex min-w-0 cursor-pointer items-center rounded-xl transition-opacity hover:opacity-85 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Image
                src="/imagens/logo_dark_menor.png"
                alt="Logo Quiz Royale"
                width={150}
                height={90}
                priority
                className="h-auto w-[112px] object-contain sm:w-[145px]"
              />
             
            </button>

            {/* Ações do usuário */}
            <div className="relative z-10 flex shrink-0 items-center gap-2 sm:gap-3">
              {mounted && token ? (
                <>
                  {/* Identificação do jogador */}
                  <div className="hidden items-center gap-2.5 rounded-2xl border border-white/[0.07] bg-white/[0.035] py-1.5 pl-1.5 pr-3 sm:flex">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-violet-200/15 bg-gradient-to-br from-fuchsia-300/15 to-cyan-300/10 text-sm font-black text-violet-100 shadow-inner shadow-white/[0.03]">
                      {inicial}
                    </div>
                    <div className="max-w-[150px]">
                      <p className="truncate text-xs font-extrabold text-white/90">
                        {nome ?? "Carregando..."}
                      </p>
                      <p className="mt-0.5 flex items-center gap-1 text-[10px] font-medium text-white/40">
                        <Sparkles size={10} className="text-fuchsia-200/70" />
                        <span className="truncate">{patente ?? "Sem classificação"}</span>
                      </p>
                    </div>
                  </div>

                  {ehAdmin && (
                    <button
                      type="button"
                      onClick={() => navegar("/dashboard")}
                      disabled={loading}
                      aria-label="Abrir dashboard administrativo"
                      title="Dashboard administrativo"
                      className="group flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl border border-violet-300/20 bg-violet-300/[0.08] text-violet-100 transition duration-200 hover:-translate-y-0.5 hover:border-violet-200/40 hover:bg-violet-300/[0.15] hover:shadow-[0_6px_24px_rgba(167,139,250,.12)] disabled:cursor-not-allowed disabled:opacity-50 sm:h-11 sm:w-11"
                    >
                      <LayoutDashboard size={17} className="transition-transform group-hover:scale-110" />
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => navegar("/perfil")}
                    disabled={loading}
                    aria-label="Abrir perfil"
                    title="Meu perfil"
                    className="group flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl border border-white/10 bg-white/[0.035] text-white/65 transition duration-200 hover:-translate-y-0.5 hover:border-cyan-200/25 hover:bg-cyan-200/[0.08] hover:text-cyan-100 disabled:cursor-not-allowed disabled:opacity-50 sm:h-11 sm:w-11"
                  >
                    <User size={18} className="transition-transform group-hover:scale-110" />
                  </button>

                  <span aria-hidden="true" className="hidden h-7 w-px bg-white/10 sm:block" />

                  <button
                    type="button"
                    onClick={logout}
                    disabled={loading}
                    aria-label="Sair da conta"
                    title="Sair da conta"
                    className="group flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl border border-white/10 bg-white/[0.025] text-white/40 transition duration-200 hover:-translate-y-0.5 hover:border-red-300/25 hover:bg-red-400/[0.08] hover:text-red-200 disabled:cursor-not-allowed disabled:opacity-50 sm:h-11 sm:w-11"
                  >
                    <LogOut size={17} className="transition-transform group-hover:translate-x-0.5" />
                  </button>
                </>
              ) : mounted ? (
                <button
                  type="button"
                  onClick={() => navegar("/login")}
                  disabled={loading}
                  className="group flex h-10 cursor-pointer items-center gap-2 rounded-xl border border-violet-200/20 bg-gradient-to-r from-violet-300/[0.13] to-fuchsia-300/[0.08] px-3.5 text-sm font-extrabold text-violet-100 transition duration-200 hover:-translate-y-0.5 hover:border-violet-200/40 hover:from-violet-300/[0.2] hover:to-fuchsia-300/[0.14] disabled:cursor-not-allowed disabled:opacity-50 sm:h-11 sm:px-4"
                >
                  <LogIn size={17} className="transition-transform group-hover:translate-x-0.5" />
                  <span>Entrar</span>
                </button>
              ) : (
                <div className="h-10 w-20 animate-pulse rounded-xl bg-white/[0.04] sm:h-11" />
              )}
            </div>
          </nav>
        </div>
      </header>
    </>
  );
}
