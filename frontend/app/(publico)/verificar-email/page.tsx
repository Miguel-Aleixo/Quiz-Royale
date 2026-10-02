"use client";

import {
  Suspense,
  useEffect,
  useState,
} from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  CheckCircle2,
  XCircle,
  Loader2,
  MailCheck,
  Mail,
  ArrowRight,
  RefreshCw,
} from "lucide-react";
import Cookies from "js-cookie";

type Status =
  | "carregando"
  | "aguardando"
  | "reenviado"
  | "sucesso"
  | "erro";

function VerificarEmailContent() {
  const searchParams = useSearchParams();

  const [status, setStatus] =
    useState<Status>("carregando");

  const [mensagem, setMensagem] = useState(
    "Verificando seu e-mail..."
  );

  const [reenviando, setReenviando] =
    useState(false);

  const [email, setEmail] =
    useState<string | null>(null);

  /*
   * ==========================================
   * PROCESSAR URL
   * ==========================================
   */
  useEffect(() => {
    const tokenParam =
      searchParams.get("token");

    const emailParam =
      searchParams.get("email");

    /*
     * ========================================
     * FLUXO 1
     * LINK RECEBIDO NO E-MAIL
     * ========================================
     */
    if (tokenParam) {
      const token = tokenParam;

      async function verificarEmail() {
        try {
          const API =
            process.env.NEXT_PUBLIC_API;

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
              Array.isArray(data?.message)
                ? data.message.join(", ")
                : data?.message ||
                    "Não foi possível verificar seu e-mail."
            );
          }

          /*
           * O dispositivo que abriu o link
           * APENAS verifica o e-mail.
           *
           * Não recebe JWT.
           * Não cria cookie.
           * Não faz login.
           *
           * O computador que realizou o cadastro
           * continua responsável por detectar a
           * verificação e iniciar sua própria sessão.
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

      return;
    }

    /*
     * ========================================
     * FLUXO 2
     * USUÁRIO LOGADO, MAS NÃO VERIFICADO
     * ========================================
     */
    if (emailParam) {
      setEmail(emailParam);
      setStatus("aguardando");

      setMensagem(
        "Confirme seu endereço de e-mail para poder jogar."
      );

      return;
    }

    /*
     * ========================================
     * NENHUM PARÂMETRO
     * ========================================
     */
    setStatus("erro");

    setMensagem(
      "Link de verificação inválido ou incompleto."
    );
  }, [searchParams]);

  /*
   * ==========================================
   * REENVIAR E-MAIL
   * ==========================================
   */
  async function reenviarEmail() {
    try {
      setReenviando(true);

      const API =
        process.env.NEXT_PUBLIC_API;

      if (!API) {
        throw new Error(
          "API não configurada."
        );
      }

      /*
       * Se o endpoint atual ainda recebe email,
       * usamos o email da URL.
       *
       * O ideal é posteriormente proteger esse
       * endpoint com JwtAuthGuard e obter o usuário
       * pelo token.
       */
      if (!email) {
        throw new Error(
          "E-mail não encontrado."
        );
      }

      const token =
        Cookies.get("token");

      const headers: HeadersInit = {
        "Content-Type":
          "application/json",
      };

      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const res = await fetch(
        `${API}/usuario/reenviar-verificacao`,
        {
          method: "POST",
          headers,
          body: JSON.stringify({
            email,
          }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          Array.isArray(data?.message)
            ? data.message.join(", ")
            : data?.message ||
                "Não foi possível reenviar o e-mail."
        );
      }

      setStatus("reenviado");

      setMensagem(
        data?.mensagem ||
          "Um novo e-mail de verificação foi enviado."
      );
    } catch (error) {
      console.error(
        "ERRO AO REENVIAR E-MAIL:",
        error
      );

      setStatus("erro");

      setMensagem(
        error instanceof Error
          ? error.message
          : "Não foi possível reenviar o e-mail."
      );
    } finally {
      setReenviando(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#080812] px-6">

      <div className="w-full max-w-md">

        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-8 text-center shadow-2xl backdrop-blur-xl">

          {/* ================================= */}
          {/* CARREGANDO */}
          {/* ================================= */}

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

          {/* ================================= */}
          {/* AGUARDANDO VERIFICAÇÃO */}
          {/* ================================= */}

          {status === "aguardando" && (
            <div className="flex flex-col items-center">

              <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full border border-amber-500/20 bg-amber-500/10">
                <Mail
                  className="text-amber-400"
                  size={30}
                />
              </div>

              <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[.15em] text-amber-400">
                <MailCheck size={15} />
                Verificação necessária
              </div>

              <h1 className="mt-4 text-2xl font-bold text-white">
                Verifique seu e-mail
              </h1>

              <p className="mt-3 text-sm leading-6 text-white/50">
                {mensagem}
              </p>

              {email && (
                <div className="mt-5 w-full rounded-2xl border border-white/10 bg-white/[0.03] p-4">

                  <p className="text-xs text-white/35">
                    E-mail cadastrado
                  </p>

                  <p className="mt-1 break-all text-sm font-semibold text-white/80">
                    {email}
                  </p>

                </div>
              )}

              <div className="mt-5 w-full rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-left">

                <div className="flex gap-3">

                  <Mail
                    size={18}
                    className="mt-0.5 shrink-0 text-amber-400"
                  />

                  <div>

                    <p className="text-sm font-semibold text-white">
                      Confira sua caixa de entrada
                    </p>

                    <p className="mt-1 text-xs leading-5 text-white/40">
                      Enviamos um link para confirmar seu
                      endereço. Depois de clicar nele, você
                      poderá voltar para o Quiz Royale.
                    </p>

                  </div>

                </div>

              </div>

              <button
                type="button"
                onClick={reenviarEmail}
                disabled={reenviando}
                className="mt-6 flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-purple-600 px-5 py-3.5 font-semibold text-white transition hover:bg-purple-500 disabled:cursor-not-allowed disabled:opacity-50"
              >

                {reenviando ? (
                  <>
                    <Loader2
                      size={18}
                      className="animate-spin"
                    />

                    Enviando...
                  </>
                ) : (
                  <>
                    <RefreshCw size={18} />

                    Reenviar e-mail
                  </>
                )}

              </button>

              <Link
                href="/perfil"
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-5 py-3.5 font-semibold text-white/70 transition hover:bg-white/10 hover:text-white"
              >
                Voltar para o perfil

                <ArrowRight size={17} />
              </Link>

            </div>
          )}

          {/* ================================= */}
          {/* E-MAIL REENVIADO */}
          {/* ================================= */}

          {status === "reenviado" && (
            <div className="flex flex-col items-center">

              <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full border border-emerald-500/20 bg-emerald-500/10">
                <MailCheck
                  className="text-emerald-400"
                  size={32}
                />
              </div>

              <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[.15em] text-emerald-400">
                <CheckCircle2 size={15} />
                E-mail enviado
              </div>

              <h1 className="mt-4 text-2xl font-bold text-white">
                Confira sua caixa de entrada
              </h1>

              <p className="mt-3 text-sm leading-6 text-white/50">
                {mensagem}
              </p>

              {email && (
                <div className="mt-5 w-full rounded-2xl border border-white/10 bg-white/[0.03] p-4">

                  <p className="text-xs text-white/35">
                    Enviado para
                  </p>

                  <p className="mt-1 break-all text-sm font-semibold text-white/80">
                    {email}
                  </p>

                </div>
              )}

              <div className="mt-5 w-full rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-left">

                <div className="flex gap-3">

                  <CheckCircle2
                    size={18}
                    className="mt-0.5 shrink-0 text-emerald-400"
                  />

                  <div>

                    <p className="text-sm font-semibold text-white">
                      Procure pelo e-mail do Quiz Royale
                    </p>

                    <p className="mt-1 text-xs leading-5 text-white/40">
                      Se não encontrar, verifique também a
                      pasta de spam ou lixo eletrônico.
                    </p>

                  </div>

                </div>

              </div>

              <Link
                href="/"
                className="mt-8 flex w-full items-center justify-center gap-2 rounded-xl bg-purple-600 px-5 py-3.5 font-semibold text-white transition hover:bg-purple-500"
              >
                Voltar para o Quiz Royale

                <ArrowRight size={18} />
              </Link>

            </div>
          )}

          {/* ================================= */}
          {/* SUCESSO */}
          {/* ================================= */}

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

          {/* ================================= */}
          {/* ERRO */}
          {/* ================================= */}

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