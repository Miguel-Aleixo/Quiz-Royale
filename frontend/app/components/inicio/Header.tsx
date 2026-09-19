"use client";

import Image from "next/image";
import { LogIn, LogOut, User } from "lucide-react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import { useEffect, useState } from "react";

import LoadingOverlay from "../global/Loading";

interface HeaderProps {
  nome?: string;
  patente?: string;
}

export default function Header({
  nome,
  patente,
}: HeaderProps) {
  const router = useRouter();

  const [token, setToken] = useState<string | undefined>(undefined);
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setToken(Cookies.get("token"));
    setMounted(true);
  }, []);

  function irParaPerfil() {
    setLoading(true);
    router.push("/perfil");
  }

  function entrar() {
    setLoading(true);
    router.push("/login");
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

      <header className="fixed left-0 right-0 top-0 z-50">
        <div className="mx-auto max-w-7xl px-5 pt-5">
          <nav className="flex h-16 items-center justify-between rounded-3xl border border-white/10 bg-[#10101d]/75 px-5 shadow-2xl shadow-black/20 backdrop-blur-xl">

            {/* Logo */}
            <button
              onClick={() => {
                setLoading(true);
                router.push("/");
              }}
              className="flex items-center transition-opacity hover:opacity-80"
            >
              <Image
                src="/imagens/logo_dark_menor.png"
                alt="Logo Quiz Royale"
                width={150}
                height={150}
                className="relative right-3 object-contain"
                priority
              />
            </button>

            {/* Usuário / Entrar */}
            {mounted && token ? (
              <div className="flex items-center gap-3">

                {/* Informações */}
                <div className="hidden text-right sm:block">
                  <p className="text-sm font-bold text-white">
                    {nome ?? "Carregando..."}
                  </p>

                  <p className="text-[11px] text-white/35">
                    {patente ?? "Sem classificação"}
                  </p>
                </div>

                {/* Perfil */}
                <button
                  onClick={irParaPerfil}
                  disabled={loading}
                  aria-label="Abrir perfil"
                  className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl border border-white/10 bg-white/5 transition hover:border-violet-400/40 hover:bg-violet-500/10 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <User
                    size={18}
                    className="text-white/70"
                  />
                </button>

                {/* Logout */}
                <button
                  onClick={logout}
                  disabled={loading}
                  aria-label="Sair"
                  className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white/50 transition hover:border-red-400/30 hover:bg-red-500/10 hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <LogOut size={17} />
                </button>

              </div>
            ) : mounted ? (
              /* Entrar */
              <button
                onClick={entrar}
                disabled={loading}
                className="flex h-10 cursor-pointer items-center gap-2 rounded-xl border border-violet-400/20 bg-violet-500/10 px-4 text-sm font-bold text-violet-200 transition hover:border-violet-400/40 hover:bg-violet-500/20 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <LogIn size={17} />

                <span>
                  Entrar
                </span>
              </button>
            ) : null}

          </nav>
        </div>
      </header>
    </>
  );
}