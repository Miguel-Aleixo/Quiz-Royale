"use client";

import { useState } from "react";
import {
    Shield,
    Settings,
    LogOut,
} from "lucide-react";
import Cookies from "js-cookie";
import { useRouter } from "next/navigation";

export default function Header() {
    const [menuAberto, setMenuAberto] = useState(false);

    const router = useRouter();

    function alternarMenu() {
        setMenuAberto((estadoAtual) => !estadoAtual);
    }

    function fecharMenu() {
        setMenuAberto(false);
    }

    function abrirConfiguracoes() {
        fecharMenu();

        router.push("/dashboard/admin/configuracoes");
    }

    function sair() {
        Cookies.remove("token");

        fecharMenu();

        router.push("/login");
    }

    return (
        <header className="flex h-20 items-center justify-between border-b border-white/5 bg-[#080812]/80 px-6 backdrop-blur-xl lg:px-8">

            {/* TÍTULO */}

            <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-purple-400">
                    Painel administrativo
                </p>

                <h2 className="mt-1 text-xl font-black">
                    Dashboard
                </h2>
            </div>

            {/* MENU DO ADMIN */}

            <div className="relative">

                <button
                    type="button"
                    onClick={alternarMenu}
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

                {/* DROPDOWN */}

                {menuAberto && (
                    <div className="absolute right-0 top-12 z-[100] w-44 rounded-xl border border-white/10 bg-[#12121e] p-2 shadow-2xl">

                        {/* CONFIGURAÇÕES */}

                        <button
                            type="button"
                            onClick={abrirConfiguracoes}
                            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-white/60 transition hover:bg-white/5 hover:text-white"
                        >
                            <Settings size={15} />

                            Configurações
                        </button>

                        {/* SAIR */}

                        <button
                            type="button"
                            onClick={sair}
                            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-red-400 transition hover:bg-red-500/5"
                        >
                            <LogOut size={15} />

                            Sair
                        </button>

                    </div>
                )}

            </div>

        </header>
    );
}