"use client";

import Image from "next/image";
import { LogIn, LogOut, User } from "lucide-react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";

interface HeaderProps {
  nome?: string;
  patente?: string;
}

export default function Header({
  nome,
  patente,
}: HeaderProps) {
  const router = useRouter();

  const token = Cookies.get("token");

  function irParaPerfil() {
    router.push("/perfil");
  }

  function entrar() {
    router.push("/login");
  }

  function logout() {
    Cookies.remove("token");
    router.push("/login");
  }

  return (
    <header className="fixed left-0 right-0 top-0 z-50">
      <div className="mx-auto max-w-7xl px-5 pt-5">
        <nav className="flex h-16 items-center justify-between rounded-2xl border border-white/10 bg-[#10101d]/75 px-5 shadow-2xl shadow-black/20 backdrop-blur-xl">

          {/* Logo */}
          <button
            onClick={() => router.push("/")}
            className="flex items-center transition-opacity hover:opacity-80"
          >
            <Image
              src="/imagens/logo_dark_menor.png"
              alt="Logo Quiz Royale"
              width={150}
              height={150}
              className="object-contain relative right-3"
              priority
            />
          </button>

          {/* Usuário / Entrar */}
          {token ? (
            <div className="flex items-center gap-3">

              {/* Informações */}
              <div className="hidden text-right sm:block">
                <p className="text-sm font-bold text-white">
                  {nome}
                </p>

                <p className="text-[11px] text-white/35">
                  {patente ?? "Sem classificação"}
                </p>
              </div>

              {/* Perfil */}
              <button
                onClick={irParaPerfil}
                aria-label="Abrir perfil"
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 transition hover:border-violet-400/40 hover:bg-violet-500/10"
              >
                <User
                  size={18}
                  className="text-white/70"
                />
              </button>

              {/* Logout */}
              <button
                onClick={logout}
                aria-label="Sair"
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white/50 transition hover:border-red-400/30 hover:bg-red-500/10 hover:text-red-300"
              >
                <LogOut size={17} />
              </button>

            </div>
          ) : (
            /* Entrar */
            <button
              onClick={entrar}
              className="flex cursor-pointer h-10 items-center gap-2 rounded-xl border border-violet-400/20 bg-violet-500/10 px-4 text-sm font-bold text-violet-200 transition hover:border-violet-400/40 hover:bg-violet-500/20"
            >
              <LogIn size={17} />

              <span>
                Entrar
              </span>
            </button>
          )}

        </nav>
      </div>
    </header>
  );
}