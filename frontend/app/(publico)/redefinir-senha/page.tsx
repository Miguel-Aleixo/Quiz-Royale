"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  ArrowUpRight,
  Check,
  Eye,
  EyeOff,
  Lock,
  Sparkles,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { toast } from "sonner";
import LoadingOverlay from "@/app/components/global/Loading";

export default function RedefinirSenhaPage() {
  const API = process.env.NEXT_PUBLIC_API;

  const router = useRouter();
  const searchParams = useSearchParams();

  const token = searchParams.get("token");

  const [senha, setSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] =
    useState("");

  const [mostrarSenha, setMostrarSenha] =
    useState(false);

  const [mostrarConfirmacao, setMostrarConfirmacao] =
    useState(false);

  const [loading, setLoading] =
    useState(false);

  const [sucesso, setSucesso] =
    useState(false);

  const [tokenValido, setTokenValido] =
    useState(true);

  useEffect(() => {
    if (!token) {
      setTokenValido(false);
    }
  }, [token]);

  async function redefinirSenha(
    e: React.FormEvent,
  ) {
    e.preventDefault();

    try {
      if (!API) {
        throw new Error(
          "API não configurada.",
        );
      }

      if (!token) {
        throw new Error(
          "Link de recuperação inválido.",
        );
      }

      if (senha.length < 8) {
        toast.error(
          "A senha deve ter no mínimo 8 caracteres.",
        );
        return;
      }

      if (senha !== confirmarSenha) {
        toast.error(
          "As senhas não coincidem.",
        );
        return;
      }

      setLoading(true);

      const response = await fetch(
        `${API}/usuario/redefinir-senha`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            token,
            senha,
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
              "Não foi possível redefinir sua senha.";

        toast.error(mensagem);
        return;
      }

      setSucesso(true);

      toast.success(
        "Senha redefinida com sucesso!",
      );

    } catch (error) {
      console.error(
        "Erro ao redefinir senha:",
        error,
      );

      toast.error(
        error instanceof Error
          ? error.message
          : "Não foi possível conectar ao servidor.",
      );
    } finally {
      setLoading(false);
    }
  }

  if (!tokenValido) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#080812] px-6 text-white">
        <div className="w-full max-w-[500px] text-center">
          <div className="mx-auto mb-7 flex h-16 w-16 items-center justify-center rounded-2xl border border-red-400/20 bg-red-500/10 text-red-300">
            <Lock size={28} />
          </div>

          <h1 className="text-3xl font-black">
            Link inválido
          </h1>

          <p className="mt-4 text-sm leading-7 text-white/45">
            O link de recuperação de senha não é válido.
            Solicite uma nova recuperação.
          </p>

          <Link
            href="/esqueci-senha"
            className="mt-8 flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 text-[13px] font-bold"
          >
            Solicitar novo link
            <ArrowUpRight size={17} />
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen overflow-hidden bg-[#080812] text-white selection:bg-purple-400 selection:text-white">
      <LoadingOverlay
        show={loading}
        message="Redefinindo senha..."
      />

      <div className="mx-auto grid min-h-screen lg:grid-cols-[minmax(420px,0.88fr)_minmax(560px,1.12fr)]">

        <section className="relative flex min-h-screen items-center justify-center px-6 py-10 sm:px-10 lg:px-14 xl:px-20">
          <div className="absolute left-0 top-0 h-40 w-40 -translate-x-1/2 -translate-y-1/2 rounded-full bg-purple-700/20 blur-3xl" />

          <div className="relative w-full max-w-[600px]">

            <Link
              href="/login"
              className="relative mb-16 inline-flex items-center gap-2 text-xs font-medium text-white/45 transition hover:text-white"
            >
              <ArrowLeft size={15} />
              Voltar para o login
            </Link>

            {!sucesso ? (
              <>
                <div className="mb-9">
                  <div className="mb-5 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[.18em] text-purple-300">
                    <span className="h-1.5 w-1.5 rounded-full bg-purple-400" />
                    Nova senha
                  </div>

                  <h1 className="text-3xl font-black tracking-tight">
                    Crie uma nova senha
                  </h1>

                  <p className="mt-3 text-sm leading-6 text-white/45">
                    Escolha uma nova senha para continuar
                    protegendo sua conta.
                  </p>
                </div>

                <form
                  onSubmit={redefinirSenha}
                  className="grid gap-5"
                >
                  <label className="grid gap-2.5">
                    <span className="text-[11px] font-bold uppercase tracking-[.1em] text-white/70">
                      Nova senha
                    </span>

                    <div className="relative">
                      <Lock
                        size={18}
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30"
                      />

                      <input
                        type={
                          mostrarSenha
                            ? "text"
                            : "password"
                        }
                        autoComplete="new-password"
                        placeholder="Nova senha"
                        value={senha}
                        onChange={(e) =>
                          setSenha(e.target.value)
                        }
                        required
                        minLength={8}
                        className="h-14 w-full rounded-2xl border border-white/10 bg-black/20 px-12 pr-14 text-sm text-white outline-none transition placeholder:text-white/25 hover:border-white/20 focus:border-purple-500/70 focus:bg-black/30 focus:ring-4 focus:ring-purple-500/10"
                      />

                      <button
                        type="button"
                        onClick={() =>
                          setMostrarSenha(
                            (valor) => !valor,
                          )
                        }
                        className="absolute right-3 top-1/2 -translate-y-1/2 rounded-xl p-2 text-purple-300 transition hover:bg-white/5"
                      >
                        {mostrarSenha ? (
                          <EyeOff size={18} />
                        ) : (
                          <Eye size={18} />
                        )}
                      </button>
                    </div>

                    <span className="text-[11px] text-white/30">
                      Mínimo de 8 caracteres.
                    </span>
                  </label>

                  <label className="grid gap-2.5">
                    <span className="text-[11px] font-bold uppercase tracking-[.1em] text-white/70">
                      Confirmar senha
                    </span>

                    <div className="relative">
                      <Lock
                        size={18}
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30"
                      />

                      <input
                        type={
                          mostrarConfirmacao
                            ? "text"
                            : "password"
                        }
                        autoComplete="new-password"
                        placeholder="Digite novamente"
                        value={confirmarSenha}
                        onChange={(e) =>
                          setConfirmarSenha(
                            e.target.value,
                          )
                        }
                        required
                        minLength={8}
                        className="h-14 w-full rounded-2xl border border-white/10 bg-black/20 px-12 pr-14 text-sm text-white outline-none transition placeholder:text-white/25 hover:border-white/20 focus:border-purple-500/70 focus:bg-black/30 focus:ring-4 focus:ring-purple-500/10"
                      />

                      <button
                        type="button"
                        onClick={() =>
                          setMostrarConfirmacao(
                            (valor) => !valor,
                          )
                        }
                        className="absolute right-3 top-1/2 -translate-y-1/2 rounded-xl p-2 text-purple-300 transition hover:bg-white/5"
                      >
                        {mostrarConfirmacao ? (
                          <EyeOff size={18} />
                        ) : (
                          <Eye size={18} />
                        )}
                      </button>
                    </div>
                  </label>

                  <button
                    type="submit"
                    className="group mt-1 flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 text-[13px] font-bold text-white shadow-lg shadow-purple-900/20 transition hover:-translate-y-0.5 hover:from-purple-500 hover:to-indigo-500"
                  >
                    Redefinir senha
                    <ArrowUpRight
                      size={17}
                      className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                    />
                  </button>
                </form>
              </>
            ) : (
              <div className="text-center">
                <div className="mx-auto mb-7 flex h-16 w-16 items-center justify-center rounded-2xl border border-emerald-400/20 bg-emerald-500/10 text-emerald-300">
                  <Check size={30} />
                </div>

                <h1 className="text-3xl font-black">
                  Senha alterada!
                </h1>

                <p className="mx-auto mt-4 max-w-[470px] text-sm leading-7 text-white/45">
                  Sua senha foi redefinida com sucesso.
                  Agora você já pode entrar novamente na
                  sua conta.
                </p>

                <button
                  type="button"
                  onClick={() =>
                    router.push("/login")
                  }
                  className="group mt-8 flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 text-[13px] font-bold"
                >
                  Ir para o login
                  <ArrowUpRight
                    size={17}
                    className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                  />
                </button>
              </div>
            )}

            <div className="mt-7 flex items-center justify-center gap-2 text-[10px] font-medium text-white/30">
              <Lock size={13} />
              Ambiente seguro e protegido
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
              Segurança da sua conta
            </div>

            <h2 className="text-[clamp(54px,6vw,70px)] font-black leading-[.9] tracking-[-.075em]">
              Volte para
              <br />
              <span className="text-purple-400">
                o jogo.
              </span>
            </h2>

            <p className="mt-8 max-w-[480px] text-[15px] leading-7 text-white/50">
              Defina uma nova senha e continue sua
              evolução no Quiz Royale.
            </p>
          </div>

          <p className="relative top-5 text-[10px] text-white/25">
            © 2026 Quiz Royale · Conhecimento que transforma.
          </p>
        </section>
      </div>
    </main>
  );
}
