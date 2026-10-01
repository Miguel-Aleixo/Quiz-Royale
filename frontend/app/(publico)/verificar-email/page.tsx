"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  CheckCircle2,
  XCircle,
  Loader2,
  MailCheck,
  ArrowRight,
} from "lucide-react";

function VerificarEmailContent() {
  const searchParams = useSearchParams();

  const [status, setStatus] = useState<
    "carregando" | "sucesso" | "erro"
  >("carregando");

  const [mensagem, setMensagem] = useState(
    "Verificando seu e-mail..."
  );

  useEffect(() => {
    const tokenParam = searchParams.get("token");

    if (!tokenParam) {
      setStatus("erro");
      setMensagem(
        "Token de verificação não encontrado."
      );
      return;
    }

    const token: string = tokenParam;

    async function verificarEmail() {
      try {
        const API = process.env.NEXT_PUBLIC_API;

        if (!API) {
          throw new Error(
            "API não configurada."
          );
        }

        const res = await fetch(
          `${API}/usuario/verificar-email?token=${encodeURIComponent(
            token
          )}`,
          {
            method: "GET",
            cache: "no-store",
          }
        );

        const data = await res.json();

        if (!res.ok) {
          throw new Error(
            data?.message ||
              "Não foi possível verificar seu e-mail."
          );
        }

        /*
         * IMPORTANTE:
         *
         * O celular APENAS verifica o e-mail.
         *
         * Ele NÃO recebe accessToken.
         * Ele NÃO cria cookie.
         * Ele NÃO faz login.
         *
         * O PC que realizou o cadastro está
         * consultando /status-verificacao.
         *
         * Quando detectar que o e-mail foi
         * confirmado, o PC receberá seu próprio JWT.
         */

        setStatus("sucesso");

        setMensagem(
          data?.mensagem ||
            "E-mail verificado com sucesso!"
        );
      } catch (error) {
        console.error(
          "ERRO AO VERIFICAR E-MAIL:",
          error
        );

        setStatus("erro");

        setMensagem(
          error instanceof Error
            ? error.message
            : "Não foi possível verificar seu e-mail."
        );
      }
    }

    verificarEmail();
  }, [searchParams]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#080812] px-6">
      <div className="w-full max-w-md">
        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-8 text-center shadow-2xl backdrop-blur-xl">

          {/* ========================= */}
          {/* CARREGANDO */}
          {/* ========================= */}

          {status === "carregando" && (
            <div className="flex flex-col items-center">
              <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full border border-purple-500/20 bg-purple-500/10">
                <Loader2
                  className="animate-spin text-purple-400"
                  size={30}
                />
              </div>

              <h1 className="text-2xl font-bold text-white">
                Verificando seu e-mail
              </h1>

              <p className="mt-3 text-sm leading-6 text-white/50">
                Aguarde enquanto confirmamos seu
                endereço de e-mail.
              </p>
            </div>
          )}

          {/* ========================= */}
          {/* SUCESSO */}
          {/* ========================= */}

          {status === "sucesso" && (
            <div className="flex flex-col items-center">
              <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full border border-emerald-500/20 bg-emerald-500/10">
                <CheckCircle2
                  className="text-emerald-400"
                  size={32}
                />
              </div>

              <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[.15em] text-emerald-400">
                <MailCheck size={15} />
                E-mail confirmado
              </div>

              <h1 className="mt-4 text-2xl font-bold text-white">
                Tudo certo!
              </h1>

              <p className="mt-3 text-sm leading-6 text-white/50">
                {mensagem}
              </p>

              <div className="mt-5 w-full rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-left">
                <div className="flex gap-3">
                  <CheckCircle2
                    size={18}
                    className="mt-0.5 shrink-0 text-emerald-400"
                  />

                  <div>
                    <p className="text-sm font-semibold text-white">
                      Sua conta foi verificada.
                    </p>

                    <p className="mt-1 text-xs leading-5 text-white/40">
                      Volte para o computador onde você
                      realizou o cadastro. O login será
                      iniciado automaticamente por lá.
                    </p>
                  </div>
                </div>
              </div>

              <Link
                href="/"
                className="mt-8 flex w-full items-center justify-center gap-2 rounded-xl bg-purple-600 px-5 py-3.5 font-semibold text-white transition hover:bg-purple-500"
              >
                Continuar

                <ArrowRight size={18} />
              </Link>
            </div>
          )}

          {/* ========================= */}
          {/* ERRO */}
          {/* ========================= */}

          {status === "erro" && (
            <div className="flex flex-col items-center">
              <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full border border-red-500/20 bg-red-500/10">
                <XCircle
                  className="text-red-400"
                  size={32}
                />
              </div>

              <h1 className="text-2xl font-bold text-white">
                Não foi possível verificar
              </h1>

              <p className="mt-3 text-sm leading-6 text-white/50">
                {mensagem}
              </p>

              <Link
                href="/login"
                className="mt-8 flex w-full items-center justify-center rounded-xl border border-white/10 bg-white/5 px-5 py-3.5 font-semibold text-white transition hover:bg-white/10"
              >
                Voltar para o login
              </Link>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

export default function VerificarEmailPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-[#080812] px-6">
          <div className="flex h-16 w-16 items-center justify-center rounded-full border border-purple-500/20 bg-purple-500/10">
            <Loader2
              className="animate-spin text-purple-400"
              size={30}
            />
          </div>
        </main>
      }
    >
      <VerificarEmailContent />
    </Suspense>
  );
}

