"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, ArrowUpRight, Check, Crown, Eye, EyeOff, Lock, Mail, Sparkles, User } from "lucide-react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import { useToken } from "@/app/hooks/usuario/useToken";
import LoadingOverlay from "@/app/components/global/Loading";
import Image from "next/image";

export default function CadastroPage() {
  const API = process.env.NEXT_PUBLIC_API;
  const [form, setForm] = useState({ nome: "", email: "", senha: "" });
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleCadastro = async (e: React.FormEvent) => {
    e.preventDefault();

    setLoading(true);

    if (form.senha !== confirmarSenha) {
      alert("As senhas não coincidem.");
      return;
    }

    try {

      const res = await fetch(`${API}/usuario`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome: form.nome.trim(), email: form.email.trim(), senha: form.senha }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(Array.isArray(data.message) ? data.message.join(", ") : data.message || "Falha no cadastro");

      login()

    } catch (err) {
      alert("Erro ao cadastrar usuário.");
      console.error(err);
    } finally {
      setLoading(false)
    }
  };

  const login = async () => {
    setLoading(true);

    try {
      const res = await fetch(`${API}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: form.email.trim(), senha: form.senha }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(Array.isArray(data.message) ? data.message.join(", ") : data.message || "Falha no login");
      }

      Cookies.set("token", data.token, { expires: 1 });

      const token = useToken();

      if (token?.role == 'ADMIN') {
        router.push('dashboard')
      } else {
        router.push('/')
      }

    } catch (err) {
      alert("Erro ao logar usuário.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen overflow-hidden bg-[#080812] text-white selection:bg-purple-400 selection:text-white">
      <LoadingOverlay show={loading} message="Autenticando..." />

      <div className="mx-auto grid min-h-screen  lg:grid-cols-[minmax(420px,0.88fr)_minmax(560px,1.12fr)]">
        {/* Área de cadastro */}
        <section className="relative flex min-h-screen items-center justify-center px-6 py-10 sm:px-10 lg:px-14 xl:px-20">
          <div className="absolute left-0 top-0 h-40 w-40 -translate-x-1/2 -translate-y-1/2 rounded-full bg-purple-700/20 blur-3xl" />
          <div className="relative w-full max-w-[600px]">
            <Link href="/" className="relative mb-12 inline-flex items-center gap-2 text-xs font-medium text-white/45 transition hover:text-white focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-offset-4 focus:ring-offset-[#080812]"><ArrowLeft size={15} /> Voltar para o início</Link>

            <div className="mb-8"><div className="mb-5 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[.18em] text-purple-300"><span className="h-1.5 w-1.5 rounded-full bg-purple-400" /> Cadastro do jogador</div><h1 className="text-2xl font-black tracking-tight md:text-3xl">Criar sua conta</h1><p className="mt-3 text-sm leading-6 text-white/45">Cadastre-se para jogar, competir e conquistar o topo.</p></div>

            <form onSubmit={handleCadastro} className="rounded-[2rem] ">
              <div className="grid gap-4">
                <label className="grid gap-2.5"><span className="text-[11px] font-bold uppercase tracking-[.1em] text-white/70">Nome</span><div className="relative"><User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" /><input type="text" autoComplete="name" value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} placeholder="Seu nome" required className="h-13 w-full rounded-2xl border border-white/10 bg-black/20 pl-12 pr-4 text-sm text-white outline-none transition placeholder:text-white/25 hover:border-white/20 focus:border-purple-500/70 focus:bg-black/30 focus:ring-4 focus:ring-purple-500/10" /></div></label>
                <label className="grid gap-2.5"><span className="text-[11px] font-bold uppercase tracking-[.1em] text-white/70">E-mail</span><div className="relative"><Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" /><input type="email" autoComplete="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="seu@email.com" required className="h-13 w-full rounded-2xl border border-white/10 bg-black/20 pl-12 pr-4 text-sm text-white outline-none transition placeholder:text-white/25 hover:border-white/20 focus:border-purple-500/70 focus:bg-black/30 focus:ring-4 focus:ring-purple-500/10" /></div></label>
                <label className="grid gap-2.5"><span className="text-[11px] font-bold uppercase tracking-[.1em] text-white/70">Senha</span><div className="relative"><Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" /><input type={showPassword ? "text" : "password"} autoComplete="new-password" value={form.senha} onChange={(e) => setForm({ ...form, senha: e.target.value })} placeholder="Crie uma senha" required minLength={6} className="h-13 w-full rounded-2xl border border-white/10 bg-black/20 px-12 pr-14 text-sm text-white outline-none transition placeholder:text-white/25 hover:border-white/20 focus:border-purple-500/70 focus:bg-black/30 focus:ring-4 focus:ring-purple-500/10" /><button type="button" onClick={() => setShowPassword((visible) => !visible)} aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"} className="absolute right-3 top-1/2 -translate-y-1/2 rounded-xl p-2 text-purple-300 hover:bg-white/5">{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button></div></label>
                <label className="grid gap-2.5"><span className="text-[11px] font-bold uppercase tracking-[.1em] text-white/70">Confirmar senha</span><div className="relative"><Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" /><input type={showConfirmPassword ? "text" : "password"} autoComplete="new-password" value={confirmarSenha} onChange={(e) => setConfirmarSenha(e.target.value)} placeholder="Digite a senha novamente" required minLength={6} className="h-13 w-full rounded-2xl border border-white/10 bg-black/20 px-12 pr-14 text-sm text-white outline-none transition placeholder:text-white/25 hover:border-white/20 focus:border-purple-500/70 focus:bg-black/30 focus:ring-4 focus:ring-purple-500/10" /><button type="button" onClick={() => setShowConfirmPassword((visible) => !visible)} aria-label={showConfirmPassword ? "Ocultar confirmação de senha" : "Mostrar confirmação de senha"} className="absolute right-3 top-1/2 -translate-y-1/2 rounded-xl p-2 text-purple-300 hover:bg-white/5">{showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button></div></label>
                <button type="submit" className="group mt-1 flex h-14 w-full rounded-2xl items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-[13px] font-bold text-white shadow-lg shadow-purple-900/20 transition hover:-translate-y-0.5 hover:from-purple-500 hover:to-indigo-500 hover:shadow-purple-900/40 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-offset-2 focus:ring-offset-[#10101c]">Criar conta <ArrowUpRight size={17} className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" /></button>
              </div>
            </form>

            <div className="my-7 flex items-center gap-3"><span className="h-px flex-1 bg-white/10" /><span className="text-[10px] font-medium uppercase tracking-[.12em] text-white/30">ou</span><span className="h-px flex-1 bg-white/10" /></div>
            <div className="text-center"><p className="text-xs text-white/45">Já possui uma conta?</p><button onClick={() => router.push('/login')} className="mt-3 flex h-12 w-full rounded-2xl items-center justify-center gap-2 border border-white/15 text-xs font-bold transition hover:border-purple-400 hover:bg-white/5 focus:outline-none focus:ring-2 focus:ring-purple-400">Fazer login <ArrowUpRight size={15} /></button></div>
            <div className="mt-7 flex items-center justify-center gap-2 text-[10px] font-medium text-white/30"><Lock size={13} /> Ambiente seguro e protegido</div>
          </div>
        </section>

        {/* Painel de posicionamento */}
        <section className="relative hidden min-h-[calc(100vh-2rem)] overflow-hidden rounded-[2.5rem] border border-white/10 bg-[#10101c] p-10 lg:my-4 lg:mr-4 text-white lg:flex lg:flex-col lg:justify-between xl:p-16"><div className="absolute -right-40 -top-36 h-[520px] w-[520px] rounded-full border border-purple-400/15" /><div className="absolute -right-16 -top-12 h-[360px] w-[360px] rounded-full border border-indigo-400/15" /><div className="absolute bottom-[-220px] left-[-180px] h-[480px] w-[480px] rounded-full bg-purple-600/10 blur-3xl" />
          <div className="relative right-5">
            <Image
              src="/imagens/logo_dark_menor.png"
              alt="Logo Quiz Royale"
              width={200}
              height={200}
              className="object-contain"
            />
          </div>


          <div className="relative max-w-[590px]"><div className="mb-7 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[.18em] text-purple-300"><Sparkles size={14} /> Sua jornada começa aqui</div><h2 className="text-[clamp(54px,6vw,70px)] font-black leading-[.9] tracking-[-.075em]">Jogue. Aprenda.<br /><span className="text-purple-400">Conquiste.</span></h2><p className="mt-8 max-w-[480px] text-[15px] leading-7 text-white/50">Crie sua conta, teste seus conhecimentos e descubra até onde você pode chegar.</p><div className="mt-10 grid max-w-[480px] gap-3 sm:grid-cols-3">{["Desafios incríveis", "Seu progresso", "Ranking Royale"].map((item) => <div key={item} className="flex items-center gap-2 text-[11px] text-white/70"><span className="flex h-5 w-5 items-center justify-center rounded-full bg-purple-400/15 text-purple-300"><Check size={12} /></span>{item}</div>)}</div></div><p className="relative top-5 text-[10px] text-white/25">© 2026 Quiz Royale · Conhecimento que transforma.</p>
        </section>
      </div>
    </main>
  );
}
