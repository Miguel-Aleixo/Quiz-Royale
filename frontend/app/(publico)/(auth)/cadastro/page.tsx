"use client";

import Link from "next/link";
import { useState } from "react";
import {
  Crown,
  User,
  Mail,
  Lock,
  ArrowRight,
  Shield,
} from "lucide-react";

export default function CadastroPage() {
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");

  function handleCadastro(e: React.FormEvent) {
    e.preventDefault();

    if (senha !== confirmarSenha) {
      alert("As senhas não coincidem.");
      return;
    }

    console.log({
      nome,
      email,
      senha,
    });

    // Depois vamos conectar ao seu backend:
    // POST /auth/cadastro
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#080812] px-6 py-10 text-white">
      {/* Background */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-[-250px] h-[600px] w-[600px] -translate-x-1/2 rounded-full bg-purple-700/20 blur-[140px]" />
        <div className="absolute bottom-[-200px] left-[-150px] h-[500px] w-[500px] rounded-full bg-indigo-700/10 blur-[130px]" />
        <div className="absolute right-[-150px] top-1/3 h-[500px] w-[500px] rounded-full bg-blue-700/10 blur-[130px]" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Logo */}
        <div className="mb-7 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-600 shadow-xl shadow-purple-900/30">
            <Crown size={27} />
          </div>

          <h1 className="text-2xl font-black">
            QUIZ <span className="text-purple-400">ROYALE</span>
          </h1>
        </div>

        {/* Card */}
        <div className="rounded-3xl border border-white/10 bg-[#10101c]/90 p-8 shadow-2xl backdrop-blur-xl">
          <div className="mb-7">
            <h2 className="text-2xl font-black">
              Criar sua conta
            </h2>

            <p className="mt-2 text-sm text-white/35">
              Cadastre-se para começar a jogar.
            </p>
          </div>

          <form onSubmit={handleCadastro} className="space-y-4">
            {/* Nome */}
            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-white/40">
                Nome
              </label>

              <div className="relative">
                <User
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-white/25"
                />

                <input
                  type="text"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="Seu nome"
                  required
                  className="
                    h-13 w-full rounded-xl
                    border border-white/10
                    bg-black/20
                    pl-12 pr-4
                    text-sm text-white
                    outline-none
                    placeholder:text-white/20
                    transition
                    focus:border-purple-500/60
                    focus:ring-4 focus:ring-purple-500/10
                  "
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-white/40">
                E-mail
              </label>

              <div className="relative">
                <Mail
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-white/25"
                />

                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  required
                  className="
                    h-13 w-full rounded-xl
                    border border-white/10
                    bg-black/20
                    pl-12 pr-4
                    text-sm text-white
                    outline-none
                    placeholder:text-white/20
                    transition
                    focus:border-purple-500/60
                    focus:ring-4 focus:ring-purple-500/10
                  "
                />
              </div>
            </div>

            {/* Senha */}
            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-white/40">
                Senha
              </label>

              <div className="relative">
                <Lock
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-white/25"
                />

                <input
                  type="password"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  placeholder="Crie uma senha"
                  required
                  minLength={6}
                  className="
                    h-13 w-full rounded-xl
                    border border-white/10
                    bg-black/20
                    pl-12 pr-4
                    text-sm text-white
                    outline-none
                    placeholder:text-white/20
                    transition
                    focus:border-purple-500/60
                    focus:ring-4 focus:ring-purple-500/10
                  "
                />
              </div>
            </div>

            {/* Confirmar senha */}
            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-white/40">
                Confirmar senha
              </label>

              <div className="relative">
                <Lock
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-white/25"
                />

                <input
                  type="password"
                  value={confirmarSenha}
                  onChange={(e) => setConfirmarSenha(e.target.value)}
                  placeholder="Digite a senha novamente"
                  required
                  minLength={6}
                  className="
                    h-13 w-full rounded-xl
                    border border-white/10
                    bg-black/20
                    pl-12 pr-4
                    text-sm text-white
                    outline-none
                    placeholder:text-white/20
                    transition
                    focus:border-purple-500/60
                    focus:ring-4 focus:ring-purple-500/10
                  "
                />
              </div>
            </div>

            {/* Botão */}
            <button
              type="submit"
              className="
                mt-2 flex h-14 w-full items-center justify-center gap-2
                rounded-xl
                bg-gradient-to-r from-purple-600 to-indigo-600
                font-bold
                shadow-lg shadow-purple-900/20
                transition
                hover:scale-[1.01]
                hover:from-purple-500
                hover:to-indigo-500
              "
            >
              Criar conta
              <ArrowRight size={18} />
            </button>
          </form>

          {/* Segurança */}
          <div className="mt-5 flex items-center justify-center gap-2 text-xs text-white/20">
            <Shield size={14} />
            <span>Seus dados estão protegidos</span>
          </div>

          {/* Login */}
          <div className="mt-6 border-t border-white/5 pt-6 text-center">
            <p className="text-sm text-white/30">
              Já possui uma conta?
            </p>

            <Link
              href="/auth/login"
              className="mt-2 inline-block text-sm font-bold text-purple-400 transition hover:text-purple-300"
            >
              Fazer login
            </Link>
          </div>
        </div>

        <Link
          href="/"
          className="mt-6 block text-center text-xs text-white/20 transition hover:text-white/50"
        >
          ← Voltar para o início
        </Link>
      </div>
    </main>
  );
}

