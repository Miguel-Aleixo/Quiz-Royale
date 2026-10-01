"use client";

import Cookies from "js-cookie";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
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
  const router = useRouter();

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
      setMensagem("Token de verificação não encontrado.");
      return;
    }

    const token: string = tokenParam;

    async function verificarEmail() {
      try {
        const API = process.env.NEXT_PUBLIC_API;

        const res = await fetch(
          `${API}/usuario/verificar-email?token=${encodeURIComponent(token)}`,
          {
            method: "GET",
          }
        );

        const data = await res.json();

        if (!res.ok) {
          throw new Error(
            data?.message ||
              "Não foi possível verificar seu e-mail."
          );
        }

        if (!data?.accessToken) {
          throw new Error(
            "E-mail verificado, mas não foi possível iniciar sua sessão."
          );
        }

        Cookies.set("token", data.accessToken, {
          expires: 1,
          sameSite: "lax",
          secure: process.env.NODE_ENV === "production",
        });

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

          {status === "carregando" && (
            <div className="flex flex-col items-center">
              <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-purple-500/10">
                <Loader2 className="h-8 w-8 animate-spin text-purple-400" />
              </div>

              <h1 className="text-2xl font-bold text-white">
                Verificando seu e-mail
              </h1>

              <p className="mt-3 text-sm text-gray-400">
                Aguarde enquanto confirmamos seu
                endereço de e-mail.
              </p>
            </div>
          )}

          {status === "sucesso" && (
            <div className="flex flex-col items-center">
              <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-green-500/10">
                <CheckCircle2 className="h-8 w-8 text-green-400" />
              </div>

              <h1 className="text-2xl font-bold text-white">
                E-mail verificado!
              </h1>

              <p className="mt-3 text-sm leading-6 text-gray-400">
                {mensagem}
              </p>

              <div className="mt-6 flex items-center gap-2 rounded-xl border border-purple-500/20 bg-purple-500/5 px-4 py-3">
                <MailCheck className="h-5 w-5 text-purple-400" />

                <span className="text-sm text-gray-300">
                  Sua conta foi ativada e você já está
                  conectado.
                </span>
              </div>

              <Link
                href="/"
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-purple-600 px-5 py-3 font-semibold text-white transition hover:bg-purple-500"
              >
                Começar a jogar
                <ArrowRight size={18} />
              </Link>
            </div>
          )}

          {status === "erro" && (
            <div className="flex flex-col items-center">
              <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-red-500/10">
                <XCircle className="h-8 w-8 text-red-400" />
              </div>

              <h1 className="text-2xl font-bold text-white">
                Não foi possível verificar
              </h1>

              <p className="mt-3 text-sm leading-6 text-gray-400">
                {mensagem}
              </p>

              <Link
                href="/login"
                className="mt-6 flex w-full items-center justify-center rounded-xl border border-white/10 bg-white/5 px-5 py-3 font-semibold text-white transition hover:bg-white/10"
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
          <div className="flex flex-col items-center text-center">
            <Loader2 className="h-8 w-8 animate-spin text-purple-400" />

            <p className="mt-4 text-sm text-gray-400">
              Carregando...
            </p>
          </div>
        </main>
      }
    >
      <VerificarEmailContent />
    </Suspense>
  );
}

