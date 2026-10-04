"use client";

import Link from "next/link";
import { useState } from "react";
import {
    ArrowLeft,
    ArrowUpRight,
    Check,
    Crown,
    Mail,
    Sparkles,
} from "lucide-react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { toast } from "sonner";
import LoadingOverlay from "@/app/components/global/Loading";

export default function EsqueciSenhaPage() {
    const API = process.env.NEXT_PUBLIC_API;

    const router = useRouter();

    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [enviado, setEnviado] = useState(false);

    async function solicitarRecuperacao(
        e: React.FormEvent,
    ) {
        e.preventDefault();

        try {
            setLoading(true);

            if (!API) {
                throw new Error(
                    "API não configurada.",
                );
            }

            const response = await fetch(
                `${API}/usuario/esquecer-senha`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        email: email.trim().toLowerCase(),
                    }),
                },
            );

            const data =
                await response.json().catch(() => null);

            if (!response.ok) {
                const mensagem =
                    Array.isArray(data?.message)
                        ? data.message.join(", ")
                        : data?.message ||
                        "Não foi possível solicitar a recuperação.";

                toast.error(mensagem);
                return;
            }

            setEnviado(true);

            toast.success(
                "Verifique seu e-mail.",
            );
        } catch (error) {
            console.error(
                "Erro ao solicitar recuperação:",
                error,
            );

            toast.error(
                "Não foi possível conectar ao servidor.",
            );
        } finally {
            setLoading(false);
        }
    }

    return (
        <main className="min-h-screen overflow-hidden bg-[#080812] text-white selection:bg-purple-400 selection:text-white">
            <LoadingOverlay
                show={loading}
                message="Enviando..."
            />

            <div className="mx-auto grid min-h-screen lg:grid-cols-[minmax(420px,0.88fr)_minmax(560px,1.12fr)]">

                <section className="relative flex min-h-screen items-center justify-center px-6 py-10 sm:px-10 lg:px-14 xl:px-20">
                    <div className="absolute left-0 top-0 h-40 w-40 -translate-x-1/2 -translate-y-1/2 rounded-full bg-purple-700/20 blur-3xl" />

                    <div className="relative w-full max-w-[600px]">

                        <Link
                            href="/login"
                            className="relative mb-16 inline-flex items-center gap-2 text-xs font-medium text-white/45 transition hover:text-white focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-offset-4 focus:ring-offset-[#080812]"
                        >
                            <ArrowLeft size={15} />
                            Voltar para o login
                        </Link>

                        {!enviado ? (
                            <>
                                <div className="mb-9">
                                    <div className="mb-5 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[.18em] text-purple-300">
                                        <span className="h-1.5 w-1.5 rounded-full bg-purple-400" />
                                        Recuperação de acesso
                                    </div>

                                    <h1 className="text-3xl font-black tracking-tight">
                                        Esqueceu sua senha?
                                    </h1>

                                    <p className="mt-3 text-sm leading-6 text-white/45">
                                        Informe o e-mail da sua conta e enviaremos
                                        um link para você criar uma nova senha.
                                    </p>
                                </div>

                                <form
                                    onSubmit={solicitarRecuperacao}
                                    className="grid gap-5"
                                >
                                    <label className="grid gap-2.5">
                                        <span className="text-[11px] font-bold uppercase tracking-[.1em] text-white/70">
                                            E-mail
                                        </span>

                                        <div className="relative">
                                            <Mail
                                                size={18}
                                                className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30"
                                            />

                                            <input
                                                type="email"
                                                autoComplete="email"
                                                placeholder="seu@email.com"
                                                value={email}
                                                onChange={(e) =>
                                                    setEmail(e.target.value)
                                                }
                                                required
                                                className="h-14 w-full rounded-2xl border border-white/10 bg-black/20 pl-12 pr-4 text-sm text-white outline-none transition placeholder:text-white/25 hover:border-white/20 focus:border-purple-500/70 focus:bg-black/30 focus:ring-4 focus:ring-purple-500/10"
                                            />
                                        </div>
                                    </label>

                                    <button
                                        type="submit"
                                        className="group mt-1 flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 text-[13px] font-bold text-white shadow-lg shadow-purple-900/20 transition hover:-translate-y-0.5 hover:from-purple-500 hover:to-indigo-500 hover:shadow-purple-900/40 active:translate-y-0 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-offset-2 focus:ring-offset-[#10101c]"
                                    >
                                        Enviar link de recuperação
                                        <ArrowUpRight
                                            size={17}
                                            className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                                        />
                                    </button>
                                </form>
                            </>
                        ) : (
                            <div className="text-center">
                                <div className="mx-auto mb-7 flex h-16 w-16 items-center justify-center rounded-2xl border border-purple-400/20 bg-purple-500/10 text-purple-300">
                                    <Check size={30} />
                                </div>

                                <h1 className="text-3xl font-black tracking-tight">
                                    Verifique seu e-mail
                                </h1>

                                <p className="mx-auto mt-4 max-w-[470px] text-sm leading-7 text-white/45">
                                    Se existir uma conta associada a esse
                                    endereço, enviamos as instruções para
                                    redefinir sua senha.
                                </p>

                                <button
                                    type="button"
                                    onClick={() =>
                                        router.push("/login")
                                    }
                                    className="group mt-8 flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 text-[13px] font-bold text-white shadow-lg shadow-purple-900/20 transition hover:-translate-y-0.5 hover:from-purple-500 hover:to-indigo-500"
                                >
                                    Voltar para o login
                                    <ArrowUpRight
                                        size={17}
                                        className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                                    />
                                </button>
                            </div>
                        )}

                        <div className="mt-7 flex items-center justify-center gap-2 text-[10px] font-medium text-white/30">
                            <Mail size={13} />
                            Recuperação segura por e-mail
                        </div>
                    </div>
                </section>

                <section className="relative mb-10 hidden min-h-[calc(90vh-2rem)] overflow-hidden rounded-[2.5rem] border border-white/10 bg-[#10101c] p-10 text-white lg:my-4 lg:mr-4 lg:flex lg:flex-col lg:justify-between xl:p-16">
                    <div className="absolute -right-40 -top-36 h-[520px] w-[520px] rounded-full border border-purple-400/15" />
                    <div className="absolute -right-16 -top-12 h-[360px] w-[360px] rounded-full border border-indigo-400/15" />
                    <div className="absolute bottom-[-220px] left-[-180px] h-[480px] w-[480px] rounded-full bg-purple-600/10 blur-3xl" />

                    <div className="relative right-5">
                        <Image
                            src="/imagens/logo_dark_menor.png"
                            alt="Logo Quiz Royale"
                            width={200}
                            height={200}
                            className="object-contain"
                        />
                    </div>

                    <div className="relative max-w-[590px]">
                        <div className="mb-7 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[.18em] text-purple-300">
                            <Sparkles size={14} />
                            Recupere seu acesso
                        </div>

                        <h2 className="text-[clamp(54px,6vw,70px)] font-black leading-[.9] tracking-[-.075em]">
                            Sua jornada
                            <br />
                            <span className="text-purple-400">
                                continua.
                            </span>
                        </h2>

                        <p className="mt-8 max-w-[480px] text-[15px] leading-7 text-white/50">
                            Redefina sua senha e volte a desafiar
                            seus conhecimentos no Quiz Royale.
                        </p>

                        <div className="mt-10 grid max-w-[480px] gap-3 sm:grid-cols-3">
                            {[
                                "Acesso seguro",
                                "Link temporário",
                                "Conta protegida",
                            ].map((item) => (
                                <div
                                    key={item}
                                    className="flex items-center gap-2 text-[11px] text-white/70"
                                >
                                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-purple-400/15 text-purple-300">
                                        <Check size={12} />
                                    </span>

                                    {item}
                                </div>
                            ))}
                        </div>
                    </div>

                    <p className="relative top-5 text-[10px] text-white/25">
                        © 2026 Quiz Royale · Conhecimento que transforma.
                    </p>
                </section>
            </div>
        </main>
    );
}
