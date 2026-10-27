"use client";

import { useEffect, useState } from "react";
import {
    Shield,
    LogOut,
    User,
    X,
    AlertTriangle,
} from "lucide-react";
import Cookies from "js-cookie";
import { useRouter } from "next/navigation";
import LoadingOverlay from "../global/Loading";

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

export default function Header() {
    const [menuAberto, setMenuAberto] = useState(false);
    const [modalSairAberto, setModalSairAberto] = useState(false);
    const [loading, setLoading] = useState(false);

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

    const nomeExibido = carregandoUsuario
    ? "Carregando perfil..."
    : usuario?.nome || "Administrador";

    const router = useRouter();

    function alternarMenu() {
        setMenuAberto((estadoAtual) => !estadoAtual);
    }

    function fecharMenu() {
        setMenuAberto(false);
    }

    function abrirPerfil() {
        setLoading(true);
        fecharMenu();

        router.push("/perfil");
    }

    function solicitarSaida() {
        fecharMenu();
        setModalSairAberto(true);
    }

    function cancelarSaida() {
        setModalSairAberto(false);
    }

    function confirmarSaida() {
        setModalSairAberto(false);
        setLoading(true);

        Cookies.remove("token");

        router.push("/login");
    }

    // Fecha o modal com a tecla Escape.
    useEffect(() => {
        if (!modalSairAberto) return;

        function handleKeyDown(event: KeyboardEvent) {
            if (event.key === "Escape") {
                cancelarSaida();
            }
        }

        window.addEventListener("keydown", handleKeyDown);

        return () => {
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, [modalSairAberto]);

    return (
        <>
            {/* LOADING */}
            <LoadingOverlay show={loading} />

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
                        disabled={loading}
                        aria-expanded={menuAberto}
                        aria-haspopup="true"
                        aria-label="Abrir menu do administrador"
                        className="flex cursor-pointer items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 transition hover:border-purple-500/30 hover:bg-white/[0.06] disabled:pointer-events-none disabled:opacity-50"
                    >
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-500/10 text-purple-400">
                            <Shield size={16} />
                        </div>

                        <div className="hidden text-left sm:block">
                            <p className="text-xs font-bold">
                                {nomeExibido}
                            </p>

                            <p className="text-[10px] text-white/25">
                                Administrador
                            </p>
                        </div>
                    </button>

                    {/* DROPDOWN */}
                    {menuAberto && !loading && (
                        <>
                            <button
                                type="button"
                                aria-label="Fechar menu"
                                onClick={fecharMenu}
                                className="fixed inset-0 z-[90] cursor-default"
                            />

                            <div className="absolute right-0 top-12 z-[100] w-48 rounded-xl border border-white/10 bg-[#12121e] p-2 shadow-2xl">
                                {/* PERFIL */}
                                <button
                                    type="button"
                                    onClick={abrirPerfil}
                                    className="flex w-full cursor-pointer items-center gap-2 rounded-lg px-3 py-2.5 text-sm text-white/60 transition hover:bg-purple-500/10 hover:text-white"
                                >
                                    <User size={15} />
                                    Perfil
                                </button>

                                {/* SAIR */}
                                <button
                                    type="button"
                                    onClick={solicitarSaida}
                                    className="flex w-full cursor-pointer items-center gap-2 rounded-lg px-3 py-2.5 text-sm text-red-400 transition hover:bg-red-500/10 hover:text-red-300"
                                >
                                    <LogOut size={15} />
                                    Sair do painel
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </header>

            {/* MODAL DE CONFIRMAÇÃO */}
            {modalSairAberto && (
                <div
                    className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
                    onMouseDown={(event) => {
                        if (event.target === event.currentTarget) {
                            cancelarSaida();
                        }
                    }}
                >
                    <section
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="titulo-modal-sair"
                        aria-describedby="descricao-modal-sair"
                        className="w-full max-w-md overflow-hidden rounded-3xl border border-white/10 bg-[#10101c] shadow-2xl shadow-black/50"
                    >
                        {/* CABEÇALHO */}
                        <div className="flex items-start justify-between border-b border-white/5 p-6">
                            <div className="flex items-center gap-4">
                                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-red-500/20 bg-red-500/10 text-red-400">
                                    <AlertTriangle size={23} />
                                </div>

                                <div>
                                    <h3
                                        id="titulo-modal-sair"
                                        className="text-lg font-bold text-white"
                                    >
                                        Sair do painel?
                                    </h3>

                                    <p className="mt-1 text-xs text-white/40">
                                        Confirme sua decisão
                                    </p>
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={cancelarSaida}
                                aria-label="Fechar modal"
                                className="cursor-pointer rounded-lg p-2 text-white/40 transition hover:bg-white/5 hover:text-white"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {/* CONTEÚDO */}
                        <div className="p-6">
                            <p
                                id="descricao-modal-sair"
                                className="text-sm leading-6 text-white/60"
                            >
                                Tem certeza que quer sair do painel administrativo?
                                Sua sessão será encerrada e você será redirecionado
                                para a página de login.
                            </p>

                            {/* BOTÕES */}
                            <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                                <button
                                    type="button"
                                    onClick={cancelarSaida}
                                    className="flex h-11 cursor-pointer items-center justify-center rounded-xl border border-white/10 px-5 text-sm font-semibold text-white/70 transition hover:bg-white/5 hover:text-white"
                                >
                                    Cancelar
                                </button>

                                <button
                                    type="button"
                                    onClick={confirmarSaida}
                                    className="flex h-11 cursor-pointer items-center justify-center gap-2 rounded-xl bg-red-500 px-5 text-sm font-bold text-white transition hover:bg-red-400 active:scale-[0.98]"
                                >
                                    <LogOut size={16} />
                                    Sim, sair
                                </button>
                            </div>
                        </div>
                    </section>
                </div>
            )}
        </>
    );
}
