"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ArrowLeft,
  ArrowUpRight,
  Check,
  Eye,
  EyeOff,
  Lock,
  Mail,
  Sparkles,
  User,
  CheckCircle2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import LoadingOverlay from "@/app/components/global/Loading";
import Image from "next/image";
import { toast } from "sonner";

export default function CadastroPage() {
  const API = process.env.NEXT_PUBLIC_API;

  const [form, setForm] = useState({
    nome: "",
    email: "",
    senha: "",
  });

  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [cadastroRealizado, setCadastroRealizado] = useState(false);

  const router = useRouter();

  const handleCadastro = async (e: React.FormEvent) => {
    e.preventDefault();

    if (form.senha !== confirmarSenha) {
      toast.error("As senhas não coincidem.");
      return;
    }

    try {
      setLoading(true);

      const res = await fetch(`${API}/usuario`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nome: form.nome.trim(),
          email: form.email.trim(),
          senha: form.senha,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        const mensagem = Array.isArray(data.message)
          ? data.message.join(", ")
          : data.message || "Falha no cadastro.";

        toast.error(mensagem);
        return;
      }

      toast.success(
        "Conta criada! Verifique seu e-mail para continuar."
      );

      setCadastroRealizado(true);
    } catch (err) {
      console.error("Erro ao cadastrar:", err);

      toast.error(
        err instanceof Error
          ? err.message
          : "Erro ao cadastrar usuário."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen overflow-hidden bg-[#080812] text-white selection:bg-purple-400 selection:text-white">
      <LoadingOverlay
        show={loading}
        message="Criando sua conta..."
      />

      <div className="mx-auto grid min-h-screen lg:grid-cols-[minmax(420px,0.88fr)_minmax(560px,1.12fr)]">
        {/* Área de cadastro */}
        <section className="relative flex min-h-screen items-center justify-center px-6 py-10 sm:px-10 lg:px-14 xl:px-20">
          <div className="absolute left-0 top-0 h-40 w-40 -translate-x-1/2 -translate-y-1/2 rounded-full bg-purple-700/20 blur-3xl" />

          <div className="relative w-full max-w-[600px]">
            <Link
              href="/"
              className="relative mb-12 inline-flex items-center gap-2 text-xs font-medium text-white/45 transition hover:text-white focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-offset-4 focus:ring-offset-[#080812]"
            >
              <ArrowLeft size={15} />
              Voltar para o início
            </Link>

            {!cadastroRealizado ? (
              <>
                <div className="mb-8">
                  <div className="mb-5 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[.18em] text-purple-300">
                    <span className="h-1.5 w-1.5 rounded-full bg-purple-400" />
                    Cadastro do jogador
                  </div>

                  <h1 className="text-2xl font-black tracking-tight md:text-3xl">
                    Criar sua conta
                  </h1>

                  <p className="mt-3 text-sm leading-6 text-white/45">
                    Cadastre-se para jogar, competir e conquistar o topo.
                  </p>
                </div>

                <form
                  onSubmit={handleCadastro}
                  className="rounded-[2rem]"
                >
                  <div className="grid gap-4">
                    {/* Nome */}
                    <label className="grid gap-2.5">
                      <span className="text-[11px] font-bold uppercase tracking-[.1em] text-white/70">
                        Nome
                      </span>

                      <div className="relative">
                        <User
                          size={18}
                          className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30"
                        />

                        <input
                          type="text"
                          autoComplete="name"
                          value={form.nome}
                          onChange={(e) =>
                            setForm({
                              ...form,
                              nome: e.target.value,
                            })
                          }
                          placeholder="Seu nome"
                          required
                          className="h-13 w-full rounded-2xl border border-white/10 bg-black/20 pl-12 pr-4 text-sm text-white outline-none transition placeholder:text-white/25 hover:border-white/20 focus:border-purple-500/70 focus:bg-black/30 focus:ring-4 focus:ring-purple-500/10"
                        />
                      </div>
                    </label>

                    {/* E-mail */}
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
                          value={form.email}
                          onChange={(e) =>
                            setForm({
                              ...form,
                              email: e.target.value,
                            })
                          }
                          placeholder="seu@email.com"
                          required
                          className="h-13 w-full rounded-2xl border border-white/10 bg-black/20 pl-12 pr-4 text-sm text-white outline-none transition placeholder:text-white/25 hover:border-white/20 focus:border-purple-500/70 focus:bg-black/30 focus:ring-4 focus:ring-purple-500/10"
                        />
                      </div>
                    </label>

                    {/* Senha */}
                    <label className="grid gap-2.5">
                      <span className="text-[11px] font-bold uppercase tracking-[.1em] text-white/70">
                        Senha
                      </span>

                      <div className="relative">
                        <Lock
                          size={18}
                          className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30"
                        />

                        <input
                          type={showPassword ? "text" : "password"}
                          autoComplete="new-password"
                          value={form.senha}
                          onChange={(e) =>
                            setForm({
                              ...form,
                              senha: e.target.value,
                            })
                          }
                          placeholder="Crie uma senha"
                          required
                          minLength={6}
                          className="h-13 w-full rounded-2xl border border-white/10 bg-black/20 px-12 pr-14 text-sm text-white outline-none transition placeholder:text-white/25 hover:border-white/20 focus:border-purple-500/70 focus:bg-black/30 focus:ring-4 focus:ring-purple-500/10"
                        />

                        <button
                          type="button"
                          onClick={() =>
                            setShowPassword((visible) => !visible)
                          }
                          aria-label={
                            showPassword
                              ? "Ocultar senha"
                              : "Mostrar senha"
                          }
                          className="absolute right-3 top-1/2 -translate-y-1/2 rounded-xl p-2 text-purple-300 hover:bg-white/5"
                        >
                          {showPassword ? (
                            <EyeOff size={18} />
                          ) : (
                            <Eye size={18} />
                          )}
                        </button>
                      </div>
                    </label>

                    {/* Confirmar senha */}
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
                            showConfirmPassword
                              ? "text"
                              : "password"
                          }
                          autoComplete="new-password"
                          value={confirmarSenha}
                          onChange={(e) =>
                            setConfirmarSenha(e.target.value)
                          }
                          placeholder="Digite a senha novamente"
                          required
                          minLength={6}
                          className="h-13 w-full rounded-2xl border border-white/10 bg-black/20 px-12 pr-14 text-sm text-white outline-none transition placeholder:text-white/25 hover:border-white/20 focus:border-purple-500/70 focus:bg-black/30 focus:ring-4 focus:ring-purple-500/10"
                        />

                        <button
                          type="button"
                          onClick={() =>
                            setShowConfirmPassword(
                              (visible) => !visible
                            )
                          }
                          aria-label={
                            showConfirmPassword
                              ? "Ocultar confirmação de senha"
                              : "Mostrar confirmação de senha"
                          }
                          className="absolute right-3 top-1/2 -translate-y-1/2 rounded-xl p-2 text-purple-300 hover:bg-white/5"
                        >
                          {showConfirmPassword ? (
                            <EyeOff size={18} />
                          ) : (
                            <Eye size={18} />
                          )}
                        </button>
                      </div>
                    </label>

                    <button
                      type="submit"
                      className="group mt-1 flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 text-[13px] font-bold text-white shadow-lg shadow-purple-900/20 transition hover:-translate-y-0.5 hover:from-purple-500 hover:to-indigo-500 hover:shadow-purple-900/40 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-offset-2 focus:ring-offset-[#10101c]"
                    >
                      Criar conta

                      <ArrowUpRight
                        size={17}
                        className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                      />
                    </button>
                  </div>
                </form>

                <div className="my-7 flex items-center gap-3">
                  <span className="h-px flex-1 bg-white/10" />
                  <span className="text-[10px] font-medium uppercase tracking-[.12em] text-white/30">
                    ou
                  </span>
                  <span className="h-px flex-1 bg-white/10" />
                </div>

                <div className="text-center">
                  <p className="text-xs text-white/45">
                    Já possui uma conta?
                  </p>

                  <button
                    onClick={() => router.push("/login")}
                    className="mt-3 flex h-12 w-full items-center justify-center gap-2 rounded-2xl border border-white/15 text-xs font-bold transition hover:border-purple-400 hover:bg-white/5 focus:outline-none focus:ring-2 focus:ring-purple-400"
                  >
                    Fazer login
                    <ArrowUpRight size={15} />
                  </button>
                </div>

                <div className="mt-7 flex items-center justify-center gap-2 text-[10px] font-medium text-white/30">
                  <Lock size={13} />
                  Ambiente seguro e protegido
                </div>
              </>
            ) : (
              /* =========================================
                 E-MAIL DE VERIFICAÇÃO
                 ========================================= */
              <div className="flex flex-col items-center text-center">
                <div className="mb-7 flex h-20 w-20 items-center justify-center rounded-3xl bg-purple-500/10">
                  <CheckCircle2
                    size={42}
                    className="text-purple-400"
                  />
                </div>

                <div className="mb-5 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[.18em] text-purple-300">
                  <Mail size={14} />
                  Quase lá
                </div>

                <h1 className="text-2xl font-black tracking-tight md:text-3xl">
                  Verifique seu e-mail
                </h1>

                <p className="mt-4 max-w-[450px] text-sm leading-7 text-white/50">
                  Enviamos um link de verificação para:
                </p>

                <p className="mt-2 break-all text-sm font-bold text-purple-300">
                  {form.email}
                </p>

                <p className="mt-5 max-w-[450px] text-sm leading-7 text-white/45">
                  Abra seu e-mail e clique no botão de verificação
                  para ativar sua conta e poder jogar no Quiz Royale.
                </p>

                <div className="mt-8 w-full rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-left">
                  <div className="flex gap-3">
                    <Mail
                      size={18}
                      className="mt-0.5 shrink-0 text-purple-400"
                    />

                    <div>
                      <p className="text-xs font-bold text-white">
                        Não encontrou?
                      </p>

                      <p className="mt-1 text-xs leading-5 text-white/40">
                        Verifique também a pasta de spam ou lixo
                        eletrônico.
                      </p>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => router.push("/login")}
                  className="mt-8 flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 text-[13px] font-bold text-white shadow-lg shadow-purple-900/20 transition hover:-translate-y-0.5 hover:from-purple-500 hover:to-indigo-500 hover:shadow-purple-900/40"
                >
                  Ir para o login
                  <ArrowUpRight size={17} />
                </button>

                <button
                  onClick={() => {
                    setCadastroRealizado(false);
                    setForm({
                      nome: "",
                      email: "",
                      senha: "",
                    });
                    setConfirmarSenha("");
                  }}
                  className="mt-4 text-xs font-medium text-white/40 transition hover:text-white"
                >
                  Voltar ao cadastro
                </button>
              </div>
            )}
          </div>
        </section>

        {/* Painel de posicionamento */}
        <section className="relative hidden min-h-[calc(100vh-2rem)] overflow-hidden rounded-[2.5rem] border border-white/10 bg-[#10101c] p-10 text-white lg:my-4 lg:mr-4 lg:flex lg:flex-col lg:justify-between xl:p-16">
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
              Sua jornada começa aqui
            </div>

            <h2 className="text-[clamp(54px,6vw,70px)] font-black leading-[.9] tracking-[-.075em]">
              Jogue. Aprenda.
              <br />
              <span className="text-purple-400">
                Conquiste.
              </span>
            </h2>

            <p className="mt-8 max-w-[480px] text-[15px] leading-7 text-white/50">
              Crie sua conta, teste seus conhecimentos e
              descubra até onde você pode chegar.
            </p>

            <div className="mt-10 grid max-w-[480px] gap-3 sm:grid-cols-3">
              {[
                "Desafios incríveis",
                "Seu progresso",
                "Ranking Royale",
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