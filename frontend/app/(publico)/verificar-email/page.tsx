"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  CheckCircle2,
  XCircle,
  Loader2,
  MailCheck,
} from "lucide-react";

export default function VerificarEmailPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [status, setStatus] = useState<
    "carregando" | "sucesso" | "erro"
  >("carregando");

  const [mensagem, setMensagem] = useState(
    "Verificando seu e-mail..."
  );

  useEffect(() => {
    const token = searchParams.get("token");

    if (!token) {
      setStatus("erro");
      setMensagem("Token de verificação não encontrado.");
      return;
    }

    const verificarEmail = async () => {
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
            data?.message || "Não foi possível verificar seu e-mail."
          );
        }

        setStatus("sucesso");
        setMensagem(
          data?.mensagem || "E-mail verificado com sucesso!"
        );
      } catch (error) {
        setStatus("erro");
        setMensagem(
          error instanceof Error
            ? error.message
            : "Não foi possível verificar seu e-mail."
        );
      }
    };

    verificarEmail();
  }, [searchParams]);

  return (
    <main className="min-h-screen bg-[#080812] flex items-center justify-center px-6">
      <div className="w-full max-w-md">
        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-8 text-center shadow-2xl backdrop-blur-xl">
          {status === "carregando" && (
            <>
              <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-purple-500/10">
                <Loader2 className="h-8 w-8 animate-spin text-purple-400" />
              </div>

              <h1 className="text-2xl font-bold text-white">
                Verificando e-mail
              </h1>

              <p className="mt-3 text-sm text-white/50">
                Aguarde enquanto confirmamos seu endereço de e-mail.
              </p>
            </>
          )}

          {status === "sucesso" && (
            <>
              <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/10">
                <CheckCircle2 className="h-9 w-9 text-emerald-400" />
              </div>

              <h1 className="text-2xl font-bold text-white">
                E-mail verificado!
              </h1>

              <p className="mt-3 text-sm leading-6 text-white/50">
                {mensagem}
              </p>

              <Link
                href="/login"
                className="mt-8 flex h-12 w-full items-center justify-center rounded-2xl bg-purple-600 text-sm font-bold text-white transition hover:bg-purple-500"
              >
                Ir para o login
              </Link>
            </>
          )}

          {status === "erro" && (
            <>
              <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-red-500/10">
                <XCircle className="h-9 w-9 text-red-400" />
              </div>

              <h1 className="text-2xl font-bold text-white">
                Não foi possível verificar
              </h1>

              <p className="mt-3 text-sm leading-6 text-white/50">
                {mensagem}
              </p>

              <div className="mt-8 space-y-3">
                <Link
                  href="/login"
                  className="flex h-12 w-full items-center justify-center rounded-2xl bg-purple-600 text-sm font-bold text-white transition hover:bg-purple-500"
                >
                  Ir para o login
                </Link>

                <button
                  onClick={() => router.refresh()}
                  className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.03] text-sm font-bold text-white/70 transition hover:bg-white/[0.06] hover:text-white"
                >
                  <MailCheck className="h-4 w-4" />
                  Tentar novamente
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </main>
  );
}