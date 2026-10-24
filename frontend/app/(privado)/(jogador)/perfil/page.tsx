"use client";

import Link from "next/link";
import {
  ArrowLeft,
  Crown,
  Trophy,
  Gamepad2,
  Target,
  Medal,
  Shield,
  Mail,
  User,
  CalendarDays,
  ChevronRight,
  CircleCheck,
  MailWarning,
  X,
  Lock,
  Save,
  Sparkles,
  Clock3,
  Users,
  Swords,
  RefreshCw,
  Award,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import Cookies from "js-cookie";
import LoadingOverlay from "@/app/components/global/Loading";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface Patente {
  id: number;
  nome: string;
  pontos: number;
}

interface Usuario {
  id: number;
  nome: string;
  email: string;
  emailVerificado: boolean;
  role: "ADMIN" | "JOGADOR";
  patenteId: number | null;
  pontuacao: number;
  patente: Patente | null;
}

interface DadosEdicao {
  nome: string;
  email: string;
  senha: string;
}

interface Estatisticas {
  partidasJogadas: number;
  vitorias: number;
  top3: number;
  acertosTotais: number;
  respostasTotais: number;
  taxaAcerto: number;
  tempoMedioResposta: number;
  melhorPosicao: number | null;
}

interface PartidaRecente {
  jogadorId: number;
  salaId: number;
  nomeSala: string;
  codigoSala: string;
  posicao: number | null;
  acertos: number;
  respostas: number;
  tempoTotal: number;
  tempoMedio: number;
  jogadoresNaPartida: number;
  finalizadaEm: string | null;
}

const inputClass =
  "h-12 w-full rounded-xl border border-white/[0.09] bg-[#0b0c18]/80 pl-11 pr-4 text-sm text-white outline-none transition placeholder:text-white/20 focus:border-fuchsia-300/40 focus:bg-white/[0.045] focus:ring-4 focus:ring-fuchsia-400/[0.06] disabled:opacity-50";

export default function PerfilPage() {
  const API = process.env.NEXT_PUBLIC_API;
  const router = useRouter();

  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [patentes, setPatentes] = useState<Patente[]>([]);
  const [estatisticas, setEstatisticas] = useState<Estatisticas | null>(null);
  const [partidas, setPartidas] = useState<PartidaRecente[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");
  const [editando, setEditando] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [erroEdicao, setErroEdicao] = useState("");
  const [sucessoEdicao, setSucessoEdicao] = useState("");
  const [dadosEdicao, setDadosEdicao] = useState<DadosEdicao>({
    nome: "",
    email: "",
    senha: "",
  });

  const buscarDados = useCallback(async () => {
    try {
      setLoading(true);
      setErro("");

      if (!API) throw new Error("API não configurada.");

      const token = Cookies.get("token");
      if (!token) {
        Cookies.remove("token");
        router.push("/login");
        return;
      }

      const partesToken = token.split(".");
      if (partesToken.length !== 3) throw new Error("Token inválido.");

      const payload = JSON.parse(atob(partesToken[1]));
      const usuarioId = Number(payload.sub);
      if (!usuarioId) throw new Error("Usuário não encontrado no token.");

      const headers = {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      };

      const [usuarioResponse, patentesResponse, estatisticasResponse, partidasResponse] =
        await Promise.all([
          fetch(`${API}/usuario/${usuarioId}`, { method: "GET", headers, cache: "no-store" }),
          fetch(`${API}/patente`, { method: "GET", headers, cache: "no-store" }),
          fetch(`${API}/usuario/me/estatisticas`, { method: "GET", headers, cache: "no-store" }),
          fetch(`${API}/usuario/me/partidas-recentes?limite=5`, { method: "GET", headers, cache: "no-store" }),
        ]);

      const [usuarioData, patentesData, estatisticasData, partidasData] = await Promise.all([
        usuarioResponse.json().catch(() => null),
        patentesResponse.json().catch(() => null),
        estatisticasResponse.json().catch(() => null),
        partidasResponse.json().catch(() => null),
      ]);

      if (!usuarioResponse.ok) {
        if (usuarioResponse.status === 401) {
          Cookies.remove("token");
          router.push("/login");
          return;
        }
        throw new Error(Array.isArray(usuarioData?.message) ? usuarioData.message.join(", ") : usuarioData?.message || "Não foi possível buscar o usuário.");
      }
      if (!patentesResponse.ok) throw new Error(Array.isArray(patentesData?.message) ? patentesData.message.join(", ") : patentesData?.message || "Não foi possível buscar as patentes.");
      if (!estatisticasResponse.ok) throw new Error(Array.isArray(estatisticasData?.message) ? estatisticasData.message.join(", ") : estatisticasData?.message || "Não foi possível buscar as estatísticas.");
      if (!partidasResponse.ok) throw new Error(Array.isArray(partidasData?.message) ? partidasData.message.join(", ") : partidasData?.message || "Não foi possível buscar o histórico.");

      const patentesOrdenadas = [...(patentesData as Patente[])].sort((a, b) => a.pontos - b.pontos);
      setUsuario(usuarioData as Usuario);
      setPatentes(patentesOrdenadas);
      setEstatisticas(estatisticasData as Estatisticas);
      setPartidas(Array.isArray(partidasData) ? partidasData : []);
    } catch (error) {
      console.error("Erro ao carregar perfil:", error);
      setErro(error instanceof Error ? error.message : "Erro ao carregar perfil.");
    } finally {
      setLoading(false);
    }
  }, [API, router]);

  useEffect(() => {
    void buscarDados();
  }, [buscarDados]);

  function abrirEdicao() {
    if (!usuario) return;
    setErroEdicao("");
    setSucessoEdicao("");
    setDadosEdicao({ nome: usuario.nome, email: usuario.email, senha: "" });
    setEditando(true);
  }

  function fecharEdicao() {
    if (salvando) return;
    setEditando(false);
    setErroEdicao("");
    setSucessoEdicao("");
  }

  async function salvarEdicao() {
    try {
      setSalvando(true);
      setErroEdicao("");
      setSucessoEdicao("");

      if (!API) throw new Error("API não configurada.");
      const token = Cookies.get("token");
      if (!token) throw new Error("Usuário não autenticado.");
      if (!usuario) throw new Error("Usuário não encontrado.");

      const nome = dadosEdicao.nome.trim();
      const email = dadosEdicao.email.trim().toLowerCase();
      if (!nome) throw new Error("O nome não pode ficar vazio.");
      if (!email) throw new Error("O e-mail não pode ficar vazio.");

      const emailMudou = email !== usuario.email.toLowerCase();
      const body: { nome: string; email: string; senha?: string } = { nome, email };
      if (dadosEdicao.senha.trim()) body.senha = dadosEdicao.senha.trim();

      const response = await fetch(`${API}/usuario/${usuario.id}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(Array.isArray(data?.message) ? data.message.join(", ") : data?.message || "Não foi possível atualizar o perfil.");
      }

      setUsuario((atual) => {
        if (!atual) return atual;
        return {
          ...atual,
          nome: data.nome ?? nome,
          email: data.email ?? email,
          emailVerificado: emailMudou ? false : data.emailVerificado ?? atual.emailVerificado,
        };
      });
      setDadosEdicao({ nome: data.nome ?? nome, email: data.email ?? email, senha: "" });

      const mensagem = emailMudou
        ? "Perfil atualizado. Seu novo e-mail precisa ser verificado."
        : "Perfil atualizado com sucesso.";
      setSucessoEdicao(mensagem);
      toast.success(mensagem);
      window.setTimeout(() => {
        setEditando(false);
        setErroEdicao("");
        setSucessoEdicao("");
      }, 1200);
    } catch (error) {
      console.error("Erro ao editar perfil:", error);
      const mensagem = error instanceof Error ? error.message : "Não foi possível atualizar o perfil.";
      setErroEdicao(mensagem);
      toast.error(mensagem);
    } finally {
      setSalvando(false);
    }
  }

  const patenteAtual = useMemo(
    () =>
      usuario?.patente ??
      patentes.find((patente) => patente.id === usuario?.patenteId) ??
      null,
    [usuario, patentes],
  );

  const proximaPatente = useMemo(
    () => patentes.find((patente) => patente.pontos > (usuario?.pontuacao ?? 0)) ?? null,
    [patentes, usuario],
  );

  let progresso = 0;
  if (usuario && proximaPatente) {
    const pontosBase = patenteAtual?.pontos ?? 0;
    const intervalo = proximaPatente.pontos - pontosBase;
    progresso = intervalo > 0
      ? Math.min(100, Math.max(0, ((usuario.pontuacao - pontosBase) / intervalo) * 100))
      : 0;
  } else if (usuario && patenteAtual) {
    progresso = 100;
  }

  const pontosFaltantes =
    usuario && proximaPatente ? Math.max(0, proximaPatente.pontos - usuario.pontuacao) : 0;

  function formatarTempo(ms: number) {
    if (!ms || ms <= 0) return "0 ms";
    if (ms < 1000) return `${Math.round(ms)} ms`;
    return `${(ms / 1000).toFixed(2)} s`;
  }

  function formatarData(data: string | null) {
    if (!data) return "-";
    const parsed = new Date(data);
    if (Number.isNaN(parsed.getTime())) return "-";
    return parsed.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }

  const taxaAcerto = estatisticas?.taxaAcerto ?? 0;

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#070711] text-white selection:bg-fuchsia-400/30">
      <LoadingOverlay show={loading} />

      {/* Background alinhado à identidade visual da Home */}
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-[-260px] h-[600px] w-[600px] -translate-x-1/2 rounded-full bg-fuchsia-700/[0.17] blur-[150px]" />
        <div className="absolute right-[-180px] top-[35%] h-[450px] w-[450px] rounded-full bg-violet-700/[0.12] blur-[140px]" />
        <div className="absolute bottom-[-220px] left-[-150px] h-[460px] w-[460px] rounded-full bg-cyan-700/[0.10] blur-[140px]" />
        <div className="absolute inset-0 opacity-[0.035] [background-image:linear-gradient(rgba(255,255,255,.8)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.8)_1px,transparent_1px)] [background-size:48px_48px]" />
        <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-[#070711]/20 to-transparent" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-40 px-3 pt-3 sm:px-5 sm:pt-5">
        <div className="mx-auto max-w-[1320px]">
          <nav className="relative flex h-[68px] items-center justify-between overflow-hidden rounded-[22px] border border-white/[0.09] bg-[#101221]/85 px-3 shadow-[0_18px_55px_rgba(0,0,0,.28)] backdrop-blur-2xl sm:h-[74px] sm:rounded-3xl sm:px-5">
            <div aria-hidden="true" className="pointer-events-none absolute -left-12 -top-16 h-36 w-36 rounded-full bg-fuchsia-500/[0.12] blur-3xl" />
            <div className="relative z-10 flex min-w-0 items-center gap-3 sm:gap-4">
              <Link
                href="/"
                aria-label="Voltar para a página inicial"
                className="flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-white/55 transition duration-200 hover:-translate-x-0.5 hover:border-fuchsia-300/30 hover:bg-fuchsia-500/10 hover:text-fuchsia-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-300/60"
              >
                <ArrowLeft size={18} />
              </Link>
              <div className="min-w-0">
               
                <h1 className="truncate text-base font-black tracking-tight sm:text-lg">Meu perfil</h1>
              </div>
            </div>
            <button
              type="button"
              onClick={() => router.push("/")}
              aria-label="Ir para a página inicial"
              className="relative z-10 flex cursor-pointer items-center rounded-xl transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-300/60"
            >
              <Image
                src="/imagens/logo_dark_menor.png"
                alt="Logo Quiz Royale"
                width={150}
                height={90}
                className="h-auto w-[105px] object-contain sm:w-[140px]"
                priority
              />
            </button>
          </nav>
        </div>
      </header>

      <section className="relative z-10 mx-auto max-w-[1320px] px-3 pb-16 pt-7 sm:px-5 sm:pt-10">
       

        {erro && (
          <div className="mb-6 flex flex-col gap-3 rounded-2xl border border-red-400/20 bg-red-400/[0.06] p-4 text-sm text-red-200 sm:flex-row sm:items-center sm:justify-between">
            <span>{erro}</span>
            <button
              type="button"
              onClick={() => void buscarDados()}
              className="inline-flex cursor-pointer items-center gap-2 self-start font-bold text-red-100 transition hover:text-white"
            >
              <RefreshCw size={14} />
              Tentar novamente
            </button>
          </div>
        )}

        {/* Email verification */}
        {!loading && usuario && !usuario.emailVerificado && (
          <div className="group relative mb-6 overflow-hidden rounded-[1.7rem] border border-amber-300/20 bg-[#17130f]/70 shadow-xl shadow-black/20 backdrop-blur-xl">
            <div aria-hidden="true" className="pointer-events-none absolute -right-12 -top-16 h-44 w-44 rounded-full bg-amber-300/[0.08] blur-3xl" />
            <div className="relative flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-amber-300/15 bg-amber-300/[0.08] text-amber-200">
                  <MailWarning size={22} />
                </div>
                <div>
                  <p className="text-sm font-black text-amber-100">Seu e-mail ainda não foi verificado</p>
                  <p className="mt-1 max-w-xl text-xs leading-5 text-white/45">
                    Verifique seu endereço para garantir o acesso completo às partidas.
                  </p>
                  <p className="mt-2 break-all text-xs font-semibold text-white/65">{usuario.email}</p>
                </div>
              </div>
              <Link
                href={`/verificar-email?email=${encodeURIComponent(usuario.email)}`}
                className="inline-flex h-11 shrink-0 cursor-pointer items-center justify-center gap-2 rounded-xl border border-amber-200/20 bg-amber-300/[0.08] px-5 text-xs font-extrabold text-amber-100 transition hover:-translate-y-0.5 hover:border-amber-200/35 hover:bg-amber-300/[0.13] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200/50"
              >
                <Mail size={15} />
                Verificar e-mail
                <ChevronRight size={14} />
              </Link>
            </div>
          </div>
        )}

        {/* Main profile card */}
        <section className="relative overflow-hidden rounded-[1.8rem] border border-white/[0.09] bg-[#10111e]/80 shadow-[0_24px_80px_rgba(0,0,0,.25)] backdrop-blur-xl sm:rounded-[2rem]">
          <div className="relative h-36 overflow-hidden sm:h-44">
            <div className="absolute inset-0 bg-gradient-to-r from-fuchsia-950/80 via-violet-950/65 to-cyan-950/50" />
            <div aria-hidden="true" className="absolute -left-10 -top-24 h-72 w-72 rounded-full bg-fuchsia-500/[0.22] blur-3xl" />
            <div aria-hidden="true" className="absolute right-[18%] top-[-8rem] h-64 w-64 rounded-full bg-cyan-400/[0.12] blur-3xl" />
            <div aria-hidden="true" className="absolute inset-0 opacity-20 [background-image:linear-gradient(135deg,transparent_45%,rgba(255,255,255,.12)_45.2%,transparent_45.7%),linear-gradient(45deg,transparent_70%,rgba(255,255,255,.08)_70.2%,transparent_70.7%)]" />
            <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-[#10111e] to-transparent" />
            <div className="absolute right-4 top-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/25 px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-wider text-white/75 backdrop-blur-md sm:right-6 sm:top-6">
              <Shield size={12} className="text-cyan-100" />
              {loading ? "Carregando" : usuario?.role === "ADMIN" ? "Administrador" : "Jogador"}
            </div>
          </div>

          <div className="relative px-5 pb-6 sm:px-8 sm:pb-8">
            <div className="-mt-14 flex h-24 w-24 items-center justify-center rounded-[1.7rem] border-4 border-[#10111e] bg-gradient-to-br from-fuchsia-400 via-violet-500 to-indigo-600 text-white shadow-[0_12px_40px_rgba(168,85,247,.25)] ring-1 ring-white/10 sm:-mt-16 sm:h-28 sm:w-28 sm:rounded-[2rem]">
              <User size={43} strokeWidth={1.7} className="sm:hidden" />
              <User size={50} strokeWidth={1.7} className="hidden sm:block" />
            </div>

            <div className="mt-5 flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
              <div className="min-w-0">
                <h3 className="break-words text-2xl font-black tracking-tight sm:text-3xl">
                  {loading ? "Carregando..." : usuario?.nome ?? "Usuário"}
                </h3>
                <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2.5 text-xs text-white/45 sm:text-sm">
                  <span className="inline-flex min-w-0 items-center gap-2 break-all">
                    <Mail size={14} className="shrink-0 text-white/30" />
                    {loading ? "Carregando..." : usuario?.email ?? "-"}
                  </span>
                  {!loading && usuario && (
                    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-bold ${
                      usuario.emailVerificado
                        ? "border-emerald-300/20 bg-emerald-300/[0.07] text-emerald-200"
                        : "border-amber-300/20 bg-amber-300/[0.07] text-amber-200"
                    }`}>
                      {usuario.emailVerificado ? <CircleCheck size={12} /> : <MailWarning size={12} />}
                      {usuario.emailVerificado ? "E-mail verificado" : "E-mail não verificado"}
                    </span>
                  )}
                  <span className="inline-flex items-center gap-2">
                    <CalendarDays size={14} className="text-white/30" />
                    Membro desde 2026
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={abrirEdicao}
                disabled={!usuario}
                className="inline-flex h-11 cursor-pointer items-center justify-center gap-2 self-start rounded-xl border border-violet-200/20 bg-gradient-to-r from-violet-300/[0.12] to-fuchsia-300/[0.08] px-4 text-xs font-extrabold text-violet-100 transition hover:-translate-y-0.5 hover:border-violet-200/35 hover:from-violet-300/[0.18] hover:to-fuchsia-300/[0.13] disabled:cursor-not-allowed disabled:opacity-40 xl:self-auto"
              >
                <User size={15} />
                Editar perfil
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </section>

        {/* Rank and stats */}
        <div className="mt-5 grid gap-5 xl:grid-cols-[0.82fr_1.18fr] sm:mt-6">
          <section className="relative overflow-hidden rounded-[1.7rem] border border-white/[0.09] bg-[#10111e]/80 p-5 shadow-xl shadow-black/20 backdrop-blur-xl sm:rounded-[2rem] sm:p-7">
            <div aria-hidden="true" className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-amber-400/[0.07] blur-3xl" />
            <div className="relative">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-white/35">Sua evolução</p>
                  <h3 className="mt-2 text-2xl font-black tracking-tight sm:text-3xl">
                    {loading ? "Carregando..." : patenteAtual?.nome ?? "Sem classificação"}
                  </h3>
                  <p className="mt-2 text-xs text-white/35">Patente atual</p>
                </div>
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-amber-200/15 bg-amber-300/[0.08] text-amber-100 shadow-lg shadow-amber-950/10 sm:h-14 sm:w-14">
                  <Crown size={25} />
                </div>
              </div>

              <div className="mt-7 flex items-end justify-between gap-3">
                <div>
                  <p className="text-xs font-medium text-white/35">Pontuação total</p>
                  <p className="mt-1 text-3xl font-black tabular-nums text-transparent bg-gradient-to-r from-fuchsia-200 to-violet-200 bg-clip-text">
                    {loading ? "..." : (usuario?.pontuacao ?? 0).toLocaleString("pt-BR")}
                    <span className="ml-2 text-xs font-bold text-white/30">PTS</span>
                  </p>
                </div>
                {patenteAtual && (
                  <div className="text-right">
                    <p className="text-[10px] font-medium text-white/30">Base da patente</p>
                    <p className="mt-1 text-sm font-extrabold text-white/75">{patenteAtual.pontos.toLocaleString("pt-BR")} pts</p>
                  </div>
                )}
              </div>

              {proximaPatente ? (
                <div className="mt-7">
                  <div className="mb-2.5 flex items-center justify-between gap-3 text-xs">
                    <span className="text-white/45">Progresso para <strong className="text-white/75">{proximaPatente.nome}</strong></span>
                    <span className="shrink-0 font-black text-fuchsia-100">{Math.round(progresso)}%</span>
                  </div>
                  <div className="h-2.5 overflow-hidden rounded-full border border-white/[0.04] bg-white/[0.06]">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-fuchsia-400 via-violet-400 to-cyan-300 shadow-[0_0_20px_rgba(217,70,239,.4)] transition-[width] duration-700"
                      style={{ width: `${progresso}%` }}
                    />
                  </div>
                  <p className="mt-3 text-xs leading-5 text-white/35">
                    Faltam <strong className="text-white/75">{pontosFaltantes.toLocaleString("pt-BR")} pontos</strong> para subir de patente.
                  </p>
                </div>
              ) : (
                <div className="mt-7 flex items-center gap-3 rounded-2xl border border-amber-200/15 bg-amber-300/[0.06] p-4">
                  <Crown size={20} className="shrink-0 text-amber-100" />
                  <div>
                    <p className="text-sm font-extrabold text-amber-50">Patente máxima alcançada</p>
                    <p className="mt-1 text-xs leading-5 text-white/40">Você chegou ao topo das patentes disponíveis.</p>
                  </div>
                </div>
              )}

              {proximaPatente && (
                <div className="mt-6 flex items-center gap-3 rounded-2xl border border-white/[0.06] bg-white/[0.025] p-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-violet-200/10 bg-violet-300/[0.07] text-violet-100">
                    <Medal size={18} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-white/35">Próximo objetivo</p>
                    <p className="mt-1 truncate text-sm font-extrabold text-white/85">{proximaPatente.nome}</p>
                  </div>
                  <div className="ml-auto shrink-0 text-right">
                    <p className="text-[10px] text-white/30">Necessário</p>
                    <p className="mt-1 text-xs font-bold text-cyan-100">{proximaPatente.pontos.toLocaleString("pt-BR")} pts</p>
                  </div>
                </div>
              )}
            </div>
          </section>

          <section className="rounded-[1.7rem] border border-white/[0.09] bg-[#10111e]/80 p-5 shadow-xl shadow-black/20 backdrop-blur-xl sm:rounded-[2rem] sm:p-7">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-white/35">Números da arena</p>
                <h3 className="mt-2 text-xl font-black tracking-tight sm:text-2xl">Seu desempenho</h3>
                <p className="mt-1 text-xs text-white/35">Resumo geral das suas partidas</p>
              </div>
              <div className="hidden h-11 w-11 items-center justify-center rounded-2xl border border-cyan-200/10 bg-cyan-200/[0.05] text-cyan-100 sm:flex">
                <Target size={20} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
              <ProfileStat icon={<Gamepad2 size={18} />} value={loading ? "..." : String(estatisticas?.partidasJogadas ?? 0)} label="Partidas" accent="violet" />
              <ProfileStat icon={<Trophy size={18} />} value={loading ? "..." : String(estatisticas?.vitorias ?? 0)} label="Vitórias" accent="amber" />
              <ProfileStat icon={<Target size={18} />} value={loading ? "..." : `${taxaAcerto.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%`} label="Precisão" accent="cyan" />
              <ProfileStat icon={<Medal size={18} />} value={loading ? "..." : estatisticas?.melhorPosicao ? `${estatisticas.melhorPosicao}º` : "-"} label="Melhor posição" accent="pink" />
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3 sm:gap-4">
              <div className="rounded-2xl border border-white/[0.06] bg-white/[0.025] p-4 sm:p-5">
                <div className="flex items-center gap-2 text-white/35">
                  <CircleCheck size={14} className="text-emerald-200/70" />
                  <p className="text-xs">Respostas registradas</p>
                </div>
                <p className="mt-2 text-xl font-black tabular-nums sm:text-2xl">{loading ? "..." : (estatisticas?.respostasTotais ?? 0).toLocaleString("pt-BR")}</p>
              </div>
              <div className="rounded-2xl border border-white/[0.06] bg-white/[0.025] p-4 sm:p-5">
                <div className="flex items-center gap-2 text-white/35">
                  <Clock3 size={14} className="text-cyan-200/70" />
                  <p className="text-xs">Tempo médio</p>
                </div>
                <p className="mt-2 text-xl font-black tabular-nums sm:text-2xl">{loading ? "..." : formatarTempo(estatisticas?.tempoMedioResposta ?? 0)}</p>
              </div>
            </div>
          </section>
        </div>

        {/* Recent games */}
        <section className="mt-5 overflow-hidden rounded-[1.7rem] border border-white/[0.09] bg-[#10111e]/80 shadow-xl shadow-black/20 backdrop-blur-xl sm:mt-6 sm:rounded-[2rem]">
          <div className="flex flex-col gap-3 border-b border-white/[0.06] px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-7">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-fuchsia-200/10 bg-fuchsia-300/[0.06] text-fuchsia-100">
                <Swords size={18} />
              </div>
              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-white/35">Seu histórico</p>
                <h3 className="mt-1 text-lg font-black sm:text-xl">Partidas recentes</h3>
              </div>
            </div>
            <span className="inline-flex items-center gap-2 self-start rounded-full border border-white/[0.07] bg-white/[0.025] px-3 py-1.5 text-[10px] font-bold text-white/40 sm:self-auto">
              <span className="h-1.5 w-1.5 rounded-full bg-cyan-300/80" />
              {partidas.length} {partidas.length === 1 ? "partida exibida" : "partidas exibidas"}
            </span>
          </div>

          {partidas.length === 0 ? (
            <div className="px-6 py-12 text-center sm:py-14">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-white/[0.07] bg-white/[0.025] text-white/25">
                <Gamepad2 size={25} />
              </div>
              <p className="mt-4 text-sm font-extrabold text-white/65">Nenhuma partida por aqui ainda</p>
              <p className="mx-auto mt-2 max-w-sm text-xs leading-5 text-white/35">Entre em uma sala e participe da sua primeira batalha. Seu histórico aparecerá aqui.</p>
              <Link href="/" className="mt-5 inline-flex h-10 cursor-pointer items-center gap-2 rounded-xl border border-violet-200/20 bg-violet-300/[0.08] px-4 text-xs font-extrabold text-violet-100 transition hover:-translate-y-0.5 hover:bg-violet-300/[0.13]">
                <Gamepad2 size={14} />
                Encontrar uma partida
                <ChevronRight size={14} />
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-white/[0.055]">
              {partidas.map((partida, index) => (
                <div key={`${partida.salaId}-${partida.jogadorId}-${partida.finalizadaEm ?? index}`} className="group flex flex-col gap-4 px-5 py-5 transition-colors hover:bg-white/[0.018] sm:px-7 sm:py-5 lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex min-w-0 items-center gap-3 sm:gap-4">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-fuchsia-200/10 bg-gradient-to-br from-fuchsia-300/[0.10] to-violet-300/[0.06] text-fuchsia-100 transition group-hover:border-fuchsia-200/20 sm:h-12 sm:w-12">
                      {partida.posicao === 1 ? <Trophy size={20} className="text-amber-100" /> : <Gamepad2 size={20} />}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-extrabold text-white/90 sm:text-base">{partida.nomeSala || "Partida sem nome"}</p>
                      <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-white/35">
                        <span>{formatarData(partida.finalizadaEm)}</span>
                        <span className="inline-flex items-center gap-1"><Users size={12} /> {partida.jogadoresNaPartida} jogadores</span>
                        {partida.codigoSala && <span className="font-mono text-white/25">#{partida.codigoSala}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3 pl-14 sm:gap-6 sm:pl-16 lg:min-w-[390px] lg:pl-0">
                    <MatchMetric label="Posição" value={partida.posicao ? `${partida.posicao}º` : "-"} highlight={partida.posicao === 1 ? "amber" : "default"} />
                    <MatchMetric label="Acertos" value={String(partida.acertos)} highlight="green" />
                    <MatchMetric label="Tempo médio" value={formatarTempo(partida.tempoMedio)} highlight="default" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Achievements */}
        <section className="mt-8 sm:mt-10">
          <div className="mb-5 flex items-end justify-between gap-4">
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-white/35">Marcos da jornada</p>
              <h3 className="mt-2 text-xl font-black tracking-tight sm:text-2xl">Suas conquistas</h3>
              <p className="mt-1 text-xs text-white/35">Continue jogando para desbloquear novos marcos.</p>
            </div>
            <div className="hidden h-11 w-11 items-center justify-center rounded-2xl border border-amber-200/10 bg-amber-300/[0.05] text-amber-100 sm:flex">
              <Award size={20} />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <Achievement icon={<Trophy size={20} />} title="Primeira vitória" description="Vença sua primeira partida" unlocked={(estatisticas?.vitorias ?? 0) >= 1} />
            <Achievement icon={<Crown size={20} />} title="Campeão" description="Termine uma partida em 1º lugar" unlocked={(estatisticas?.melhorPosicao ?? 999) === 1} />
            <Achievement icon={<Target size={20} />} title="Precisão" description="Acumule 90% de acerto" unlocked={(estatisticas?.taxaAcerto ?? 0) >= 90} />
            <Achievement icon={<Medal size={20} />} title="Veterano" description="Jogue 50 partidas" unlocked={(estatisticas?.partidasJogadas ?? 0) >= 50} />
          </div>
        </section>
      </section>

      {/* Edit profile modal */}
      {editando && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-black/75 p-3 backdrop-blur-md sm:p-5"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !salvando) fecharEdicao();
          }}
        >
          <div role="dialog" aria-modal="true" aria-labelledby="editar-perfil-titulo" className="my-auto w-full max-w-lg overflow-hidden rounded-[1.7rem] border border-white/[0.10] bg-[#10111e] shadow-[0_30px_100px_rgba(0,0,0,.65)] sm:rounded-[2rem]">
            <div className="relative overflow-hidden border-b border-white/[0.06] px-5 py-5 sm:px-6">
              <div aria-hidden="true" className="pointer-events-none absolute -right-12 -top-20 h-40 w-40 rounded-full bg-fuchsia-500/[0.12] blur-3xl" />
              <div className="relative flex items-center justify-between gap-4">
                <div>
                  <p className="inline-flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-[0.2em] text-fuchsia-200/75"><Sparkles size={12} /> Configurações</p>
                  <h2 id="editar-perfil-titulo" className="mt-1 text-xl font-black">Editar perfil</h2>
                  <p className="mt-1 text-xs text-white/35">Mantenha suas informações atualizadas.</p>
                </div>
                <button type="button" onClick={fecharEdicao} disabled={salvando} aria-label="Fechar edição" className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.03] text-white/45 transition hover:border-white/15 hover:bg-white/[0.07] hover:text-white disabled:cursor-not-allowed disabled:opacity-40">
                  <X size={17} />
                </button>
              </div>
            </div>

            <div className="space-y-5 p-5 sm:p-6">
              {erroEdicao && <div role="alert" className="rounded-xl border border-red-400/20 bg-red-400/[0.07] p-3 text-xs font-medium leading-5 text-red-200">{erroEdicao}</div>}
              {sucessoEdicao && (
                <div role="status" className="flex items-start gap-2 rounded-xl border border-emerald-300/20 bg-emerald-300/[0.06] p-3 text-xs font-medium leading-5 text-emerald-100">
                  <CircleCheck size={16} className="mt-0.5 shrink-0" />
                  <span>{sucessoEdicao}</span>
                </div>
              )}

              <div>
                <label htmlFor="perfil-nome" className="mb-2 block text-xs font-extrabold text-white/60">Nome</label>
                <div className="relative">
                  <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
                  <input id="perfil-nome" type="text" autoComplete="name" maxLength={80} value={dadosEdicao.nome} onChange={(event) => setDadosEdicao((atual) => ({ ...atual, nome: event.target.value }))} disabled={salvando} className={inputClass} placeholder="Seu nome" />
                </div>
              </div>

              <div>
                <label htmlFor="perfil-email" className="mb-2 block text-xs font-extrabold text-white/60">E-mail</label>
                <div className="relative">
                  <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
                  <input id="perfil-email" type="email" autoComplete="email" maxLength={254} value={dadosEdicao.email} onChange={(event) => setDadosEdicao((atual) => ({ ...atual, email: event.target.value }))} disabled={salvando} className={inputClass} placeholder="seu@email.com" />
                </div>
                <p className="mt-2 text-[11px] leading-5 text-white/35">Se você alterar o e-mail, será necessário verificá-lo novamente.</p>
              </div>

              <div>
                <label htmlFor="perfil-senha" className="mb-2 block text-xs font-extrabold text-white/60">Nova senha <span className="ml-1 font-medium text-white/30">opcional</span></label>
                <div className="relative">
                  <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
                  <input id="perfil-senha" type="password" autoComplete="new-password" minLength={8} maxLength={128} value={dadosEdicao.senha} onChange={(event) => setDadosEdicao((atual) => ({ ...atual, senha: event.target.value }))} disabled={salvando} className={inputClass} placeholder="Digite apenas se quiser alterar" />
                </div>
                <p className="mt-2 text-[11px] leading-5 text-white/35">Deixe vazio para manter sua senha atual.</p>
              </div>
            </div>

            <div className="flex flex-col-reverse gap-3 border-t border-white/[0.06] bg-white/[0.015] p-5 sm:flex-row sm:p-6">
              <button type="button" onClick={fecharEdicao} disabled={salvando} className="h-11 cursor-pointer rounded-xl border border-white/[0.09] bg-white/[0.025] px-4 text-xs font-extrabold text-white/55 transition hover:bg-white/[0.06] hover:text-white disabled:cursor-not-allowed disabled:opacity-40 sm:flex-1">
                Cancelar
              </button>
              <button type="button" onClick={salvarEdicao} disabled={salvando} className="inline-flex h-11 cursor-pointer items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-fuchsia-500 to-violet-600 px-4 text-xs font-extrabold text-white shadow-lg shadow-fuchsia-950/25 transition hover:-translate-y-0.5 hover:from-fuchsia-400 hover:to-violet-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-200/60 disabled:cursor-not-allowed disabled:opacity-50 sm:flex-[1.25]">
                {salvando ? <RefreshCw size={15} className="animate-spin" /> : <Save size={15} />}
                {salvando ? "Salvando..." : "Salvar alterações"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

function ProfileStat({
  icon,
  value,
  label,
  accent = "violet",
}: {
  icon: React.ReactNode;
  value: string;
  label: string;
  accent?: "violet" | "amber" | "cyan" | "pink";
}) {
  const accentClasses = {
    violet: "border-violet-200/10 bg-violet-300/[0.07] text-violet-100 group-hover:border-violet-200/20",
    amber: "border-amber-200/10 bg-amber-300/[0.07] text-amber-100 group-hover:border-amber-200/20",
    cyan: "border-cyan-200/10 bg-cyan-300/[0.07] text-cyan-100 group-hover:border-cyan-200/20",
    pink: "border-fuchsia-200/10 bg-fuchsia-300/[0.07] text-fuchsia-100 group-hover:border-fuchsia-200/20",
  };

  return (
    <div className="group min-w-0 rounded-2xl border border-white/[0.06] bg-white/[0.025] p-4 transition duration-200 hover:-translate-y-0.5 hover:border-white/[0.12] hover:bg-white/[0.04] sm:p-4">
      <div className={`mb-4 flex h-9 w-9 items-center justify-center rounded-xl border transition ${accentClasses[accent]}`}>
        {icon}
      </div>
      <p className="break-words text-xl font-black tabular-nums sm:text-2xl">{value}</p>
      <p className="mt-1.5 text-[10px] font-semibold leading-4 text-white/35 sm:text-xs">{label}</p>
    </div>
  );
}

function MatchMetric({
  label,
  value,
  highlight = "default",
}: {
  label: string;
  value: string;
  highlight?: "default" | "amber" | "green";
}) {
  const valueClass =
    highlight === "amber"
      ? "text-amber-100"
      : highlight === "green"
        ? "text-emerald-200"
        : "text-white/85";

  return (
    <div className="min-w-0 text-left lg:text-right">
      <p className="text-[9px] font-extrabold uppercase tracking-[0.12em] text-white/30 sm:text-[10px]">{label}</p>
      <p className={`mt-1 truncate text-sm font-black tabular-nums sm:text-base ${valueClass}`}>{value}</p>
    </div>
  );
}

function Achievement({
  icon,
  title,
  description,
  unlocked = false,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  unlocked?: boolean;
}) {
  return (
    <div className={`group relative overflow-hidden rounded-[1.4rem] border p-5 transition duration-200 hover:-translate-y-0.5 ${
      unlocked
        ? "border-fuchsia-200/15 bg-gradient-to-br from-fuchsia-300/[0.07] to-violet-300/[0.035] hover:border-fuchsia-200/25"
        : "border-white/[0.06] bg-[#10111e]/65 opacity-65 hover:opacity-85"
    }`}>
      {unlocked && <div aria-hidden="true" className="pointer-events-none absolute -right-8 -top-10 h-24 w-24 rounded-full bg-fuchsia-400/[0.07] blur-2xl" />}
      <div className="relative flex items-start justify-between gap-3">
        <div className={`flex h-11 w-11 items-center justify-center rounded-xl border ${
          unlocked
            ? "border-fuchsia-200/15 bg-fuchsia-300/[0.08] text-fuchsia-100"
            : "border-white/[0.06] bg-white/[0.025] text-white/35"
        }`}>
          {icon}
        </div>
        {unlocked && <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200/15 bg-emerald-300/[0.06] px-2 py-1 text-[9px] font-extrabold uppercase tracking-wide text-emerald-100"><CircleCheck size={10} /> Obtida</span>}
      </div>
      <h4 className={`relative mt-4 text-sm font-extrabold ${unlocked ? "text-white/90" : "text-white/60"}`}>{title}</h4>
      <p className="relative mt-2 text-xs leading-5 text-white/40">{description}</p>
      {!unlocked && <p className="relative mt-4 text-[9px] font-extrabold uppercase tracking-[0.15em] text-white/25">Ainda não desbloqueada</p>}
    </div>
  );
}
