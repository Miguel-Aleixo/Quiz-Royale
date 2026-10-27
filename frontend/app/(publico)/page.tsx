"use client";

import {
  ArrowDownRight,
  ArrowRight,
  CheckCircle2,
  Crown,
  Gamepad2,
  Mail,
  Plus,
  RefreshCw,
  Search,
  Shield,
  Sparkles,
  Swords,
  Trophy,
  Users,
  Zap,
  Clock3,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import { toast } from "sonner";

import Header from "../components/inicio/Header";
import LoadingOverlay from "../components/global/Loading";

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
  pontuacao: number;
  patente?: Patente | null;
  proximaPatente?: Patente | null;
  progresso: number;
}

interface Sala {
  id: number;
  nome: string;
  codigo: string;
  status: string;
  maxJogadores: number;
  criadorId?: number | null;
  _count?: { jogadores: number; rodadas: number };
}

interface Pergunta {
  id: number;
  enunciado: string;
  temaId: number;
}

type FiltroSalas = "TODAS" | "DISPONIVEIS" | "MINHAS";

const LIMITE_CARACTERES_BUSCA = 40;
const SALAS_POR_PAGINA = 6;

export default function Home() {
  const router = useRouter();
  const API = process.env.NEXT_PUBLIC_API;

  const [busca, setBusca] = useState("");
  const [paginaSalas, setPaginaSalas] = useState(1);
  const [filtroSalas, setFiltroSalas] = useState<FiltroSalas>("TODAS");
  const [token, setToken] = useState<string | undefined>(undefined);
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [salas, setSalas] = useState<Sala[]>([]);
  const [perguntas, setPerguntas] = useState<Pergunta[]>([]);
  const [codigo, setCodigo] = useState("");
  const [loadingUsuario, setLoadingUsuario] = useState(false);
  const [loadingSalas, setLoadingSalas] = useState(false);
  const [loadingPerguntas, setLoadingPerguntas] = useState(false);

  const estaLogado = mounted && Boolean(token);
  const emailNaoVerificado =
    estaLogado && usuario !== null && !usuario.emailVerificado;

  function tratarAcesso() {
    if (!estaLogado) {
      setLoading(true);
      router.push("/login");
      return;
    }
    if (emailNaoVerificado && usuario) {
      setLoading(true);
      router.push(`/verificar-email?email=${encodeURIComponent(usuario.email)}`);
    }
  }

  async function buscarUsuario(currentToken: string) {
    try {
      setLoadingUsuario(true);
      const partes = currentToken.split(".");
      if (partes.length !== 3) throw new Error("Token inválido.");
      const payload = JSON.parse(atob(partes[1]));
      if (!payload.sub) throw new Error("Usuário não encontrado no token.");

      const res = await fetch(`${API}/usuario/${payload.sub}`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${currentToken}`,
        },
        cache: "no-store",
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(
          Array.isArray(data.message)
            ? data.message.join(", ")
            : data.message || "Erro ao buscar usuário."
        );
      }
      setUsuario(data);
    } catch (error) {
      console.error("Erro ao buscar usuário:", error);
      toast.error(error instanceof Error ? error.message : "Não foi possível carregar seu usuário.");
    } finally {
      setLoadingUsuario(false);
    }
  }

  async function buscarSalas(currentToken: string) {
    try {
      setLoadingSalas(true);
      const res = await fetch(`${API}/sala`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${currentToken}`,
        },
        cache: "no-store",
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(
          Array.isArray(data.message)
            ? data.message.join(", ")
            : data.message || "Erro ao buscar salas."
        );
      }
      setSalas(data);
    } catch (error) {
      console.error("Erro ao buscar salas:", error);
      toast.error(error instanceof Error ? error.message : "Não foi possível carregar as salas.");
    } finally {
      setLoadingSalas(false);
    }
  }

  async function buscarPerguntas(currentToken: string) {
    try {
      setLoadingPerguntas(true);
      const res = await fetch(`${API}/pergunta`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${currentToken}`,
        },
        cache: "no-store",
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(
          Array.isArray(data.message)
            ? data.message.join(", ")
            : data.message || "Erro ao buscar perguntas."
        );
      }
      setPerguntas(data);
    } catch (error) {
      console.error("Erro ao buscar perguntas:", error);
      toast.error(error instanceof Error ? error.message : "Não foi possível carregar as perguntas.");
    } finally {
      setLoadingPerguntas(false);
    }
  }

  useEffect(() => {
    const currentToken = Cookies.get("token");
    setToken(currentToken);
    setMounted(true);
    if (!currentToken) return;
    buscarUsuario(currentToken);
    buscarSalas(currentToken);
    buscarPerguntas(currentToken);
  }, []);

  const minhasSalas = useMemo(() => {
    if (!usuario) return [];
    return salas
      .filter((sala) => Number(sala.criadorId) === Number(usuario.id))
      .sort((a, b) => b.id - a.id);
  }, [salas, usuario]);

  const salasAbertas = useMemo(
    () => salas.filter((sala) => sala.status === "ABERTA"),
    [salas]
  );

  const salasExibidas = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    let resultado: Sala[];

    if (filtroSalas === "MINHAS") {
      resultado = minhasSalas;
    } else if (filtroSalas === "DISPONIVEIS") {
      resultado = salasAbertas;
    } else {
      const unicas = new Map<number, Sala>();
      salasAbertas.forEach((sala) => unicas.set(sala.id, sala));
      minhasSalas.forEach((sala) => unicas.set(sala.id, sala));
      resultado = Array.from(unicas.values()).sort((a, b) => b.id - a.id);
    }

    return resultado.filter((sala) => {
      if (!termo) return true;
      return (
        sala.nome.toLowerCase().includes(termo) ||
        sala.codigo.toLowerCase().includes(termo) ||
        String(sala.id).includes(termo)
      );
    });
  }, [salasAbertas, minhasSalas, busca, filtroSalas]);

  const totalPaginasSalas = Math.max(
    1,
    Math.ceil(salasExibidas.length / SALAS_POR_PAGINA),
  );

  const salasPaginadas = useMemo(() => {
    const inicio = (paginaSalas - 1) * SALAS_POR_PAGINA;
    return salasExibidas.slice(inicio, inicio + SALAS_POR_PAGINA);
  }, [salasExibidas, paginaSalas]);

  useEffect(() => {
    setPaginaSalas(1);
  }, [busca, filtroSalas]);

  useEffect(() => {
    if (paginaSalas > totalPaginasSalas) {
      setPaginaSalas(totalPaginasSalas);
    }
  }, [paginaSalas, totalPaginasSalas]);

  const totalSalasUnicas = useMemo(() => {
    const unicas = new Map<number, Sala>();
    salasAbertas.forEach((sala) => unicas.set(sala.id, sala));
    minhasSalas.forEach((sala) => unicas.set(sala.id, sala));
    return unicas.size;
  }, [salasAbertas, minhasSalas]);

  const jogadoresNasSalas = useMemo(
    () => salas.reduce((total, sala) => total + (sala._count?.jogadores ?? 0), 0),
    [salas]
  );

  async function entrarNaSala() {
    try {
      if (!estaLogado || emailNaoVerificado) {
        tratarAcesso();
        return;
      }
      setLoading(true);
      const currentToken = Cookies.get("token");
      if (!currentToken) {
        router.push("/login");
        return;
      }
      const codigoFormatado = codigo.trim().toUpperCase();
      if (!codigoFormatado) {
        toast.warning("Digite o código da sala.");
        return;
      }
      const res = await fetch(`${API}/sala/entrar`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${currentToken}`,
        },
        body: JSON.stringify({ codigo: codigoFormatado }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(
          Array.isArray(data.message)
            ? data.message.join(", ")
            : data.message || "Erro ao entrar na sala."
        );
      }
      toast.success("Você entrou na sala!");
      router.push(`/sala/entrar?codigo=${codigoFormatado}`);
    } catch (error) {
      console.error("Erro ao entrar na sala:", error);
      toast.error(error instanceof Error ? error.message : "Não foi possível entrar na sala.");
    } finally {
      setLoading(false);
    }
  }

  async function entrarDiretoNaSala(sala: Sala) {
    try {
      if (!estaLogado || emailNaoVerificado) {
        tratarAcesso();
        return;
      }
      setLoading(true);
      const currentToken = Cookies.get("token");
      if (!currentToken) {
        router.push("/login");
        return;
      }
      const res = await fetch(`${API}/sala/entrar`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${currentToken}`,
        },
        body: JSON.stringify({ codigo: sala.codigo }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(
          Array.isArray(data.message)
            ? data.message.join(", ")
            : data.message || "Erro ao entrar na sala."
        );
      }
      toast.success("Você entrou na sala!");
      router.push(`/sala/entrar?codigo=${sala.codigo}`);
    } catch (error) {
      console.error("Erro ao entrar na sala:", error);
      toast.error(error instanceof Error ? error.message : "Não foi possível entrar na sala.");
    } finally {
      setLoading(false);
    }
  }

  async function reabrirSala(salaId: number) {
    try {
      if (!estaLogado || emailNaoVerificado) {
        tratarAcesso();
        return;
      }
      setLoading(true);
      const currentToken = Cookies.get("token");
      if (!currentToken) {
        router.push("/login");
        return;
      }
      const res = await fetch(`${API}/sala/${salaId}/reabrir`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${currentToken}`,
        },
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(
          Array.isArray(data.message)
            ? data.message.join(", ")
            : data.message || "Não foi possível reabrir a sala."
        );
      }
      toast.success("Sala reaberta! Um novo código foi gerado.");
      await buscarSalas(currentToken);
    } catch (error) {
      console.error("Erro ao reabrir sala:", error);
      toast.error(error instanceof Error ? error.message : "Não foi possível reabrir a sala.");
    } finally {
      setLoading(false);
    }
  }

  const abrirCriacao = () => {
    if (!estaLogado) {
      setLoading(true);
      router.push("/login");
      return;
    }
    if (emailNaoVerificado && usuario) {
      setLoading(true);
      router.push(`/verificar-email?email=${encodeURIComponent(usuario.email)}`);
      return;
    }
    setLoading(true);
    router.push("/sala/criar");
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#080914] text-white selection:bg-fuchsia-300/30">
      <LoadingOverlay show={loading || loadingPerguntas || loadingSalas || loadingUsuario} />

      {/* Background editorial: glow, grid e vinheta */}
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-48 -top-48 h-[38rem] w-[38rem] rounded-full bg-fuchsia-700/20 blur-[130px]" />
        <div className="absolute right-[-12rem] top-[18%] h-[34rem] w-[34rem] rounded-full bg-cyan-500/10 blur-[130px]" />
        <div className="absolute bottom-[-22rem] left-[28%] h-[42rem] w-[42rem] rounded-full bg-violet-700/15 blur-[140px]" />
        <div className="absolute inset-0 opacity-[0.045] [background-image:linear-gradient(rgba(255,255,255,.8)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.8)_1px,transparent_1px)] [background-size:54px_54px]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,transparent_0%,rgba(8,9,20,.18)_52%,#080914_100%)]" />
      </div>

      <Header nome={usuario?.nome} patente={usuario?.patente?.nome} />

      <section className="relative z-10 mx-auto max-w-[1320px] px-4 pb-14 pt-24 sm:px-7 lg:px-10 lg:pt-28">
        {/* HERO */}
        <div className="relative mb-7 overflow-hidden rounded-[30px] border border-white/[0.09] bg-[#111323]/80 p-6 shadow-[0_30px_100px_rgba(0,0,0,.24)] backdrop-blur-xl sm:p-9 lg:p-11">
          <div aria-hidden="true" className="absolute right-[-2rem] top-[-7rem] h-[25rem] w-[25rem] rounded-full border border-fuchsia-200/[0.08]" />
          <div aria-hidden="true" className="absolute right-[2rem] top-[-3rem] h-[17rem] w-[17rem] rounded-full border border-cyan-200/[0.10]" />
          <div aria-hidden="true" className="absolute right-[7rem] top-[2rem] h-[8rem] w-[8rem] rounded-full bg-gradient-to-br from-fuchsia-500/20 to-cyan-400/10 blur-2xl" />

          <div className="relative grid gap-9 lg:grid-cols-[1.15fr_.85fr] lg:items-end">
            <div>
              
              <h1 className="max-w-3xl text-[2.65rem] font-black leading-[.98] tracking-[-.065em] sm:text-6xl lg:text-[4.6rem]">
                Pronto para
                <span className="mt-2 block bg-gradient-to-r from-fuchsia-200 via-violet-200 to-cyan-200 bg-clip-text pb-1 text-transparent">
                  dominar a arena?
                </span>
              </h1>
              <p className="mt-5 max-w-xl text-sm leading-7 text-white/50 sm:text-base">
                Conhecimento é sua arma. Velocidade é sua vantagem. Entre na disputa e conquiste seu lugar no topo.
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <button
                  onClick={abrirCriacao}
                  className="group inline-flex items-center gap-2.5 rounded-xl bg-white px-5 py-3.5 text-sm font-black text-[#101020] shadow-[0_8px_30px_rgba(255,255,255,.08)] transition hover:-translate-y-0.5 hover:bg-fuchsia-100 cursor-pointer"
                >
                  <Plus size={17} />
                  Criar batalha
                  <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
                </button>
                <button
                  onClick={() => document.getElementById("salas")?.scrollIntoView({ behavior: "smooth", block: "start" })}
                  className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.035] px-5 py-3.5 text-sm font-bold text-white/75 transition hover:border-white/20 hover:bg-white/[0.07] hover:text-white cursor-pointer"
                >
                  Explorar salas
                  <ArrowDownRight size={16} />
                </button>
              </div>
            </div>

            <div className="relative lg:pl-6">
              <div className="relative overflow-hidden rounded-[24px] border border-white/10 bg-[#0a0c19]/80 p-5 sm:p-6">
                <div className="absolute right-0 top-0 h-32 w-32 rounded-full bg-cyan-400/10 blur-3xl" />
                <div className="relative flex items-center justify-between border-b border-white/[0.08] pb-4">
                  <div>
                    <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-white/35">Status da arena</p>
                    <p className="mt-1.5 text-lg font-black tracking-tight">Sua próxima vitória começa aqui</p>
                  </div>
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-cyan-200/15 bg-cyan-300/[0.08] text-cyan-100">
                    <Swords size={21} />
                  </div>
                </div>
                <div className="relative grid grid-cols-3 gap-2 pt-4">
                  <div className="rounded-xl bg-white/[0.035] p-3">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-white/35">Salas</p>
                    <p className="mt-1 text-2xl font-black tabular-nums">{estaLogado ? totalSalasUnicas : "—"}</p>
                    <p className="mt-1 text-[10px] text-white/30">no radar</p>
                  </div>
                  <div className="rounded-xl bg-white/[0.035] p-3">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-white/35">Abertas</p>
                    <p className="mt-1 text-2xl font-black tabular-nums">{estaLogado ? salasAbertas.length : "—"}</p>
                    <p className="mt-1 text-[10px] text-emerald-200/60">para entrar</p>
                  </div>
                  <div className="rounded-xl bg-white/[0.035] p-3">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-white/35">Jogadores</p>
                    <p className="mt-1 text-2xl font-black tabular-nums">{estaLogado ? jogadoresNasSalas : "—"}</p>
                    <p className="mt-1 text-[10px] text-white/30">nas salas</p>
                  </div>
                </div>
                <div className="relative mt-4 flex items-center gap-3 rounded-xl border border-fuchsia-200/10 bg-gradient-to-r from-fuchsia-400/[0.08] to-cyan-400/[0.05] p-3.5">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-fuchsia-300/10 text-fuchsia-100">
                    <Zap size={17} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-extrabold">Entre no ritmo da disputa</p>
                    <p className="mt-1 text-[11px] leading-4 text-white/40">Responda rápido. Suba no ranking. Ganhe sua patente.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* AÇÕES PRINCIPAIS */}
        <div className="mb-5 grid gap-4 lg:grid-cols-[1.1fr_.9fr]">
          <section className="group relative overflow-hidden rounded-[26px] border border-violet-300/20 bg-gradient-to-br from-[#20183d] via-[#17152e] to-[#101323] p-5 sm:p-7">
            <div aria-hidden="true" className="absolute -right-10 -top-16 h-56 w-56 rounded-full bg-violet-500/20 blur-[80px] transition group-hover:bg-violet-400/25" />
            <div className="relative">
              <div className="flex items-start justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-violet-200/15 bg-violet-300/10 text-violet-100">
                  <Gamepad2 size={23} />
                </div>
              </div>
              <h2 className="mt-5 text-2xl font-black tracking-tight sm:text-[1.7rem]">Entrar em uma sala</h2>
              <p className="mt-2 max-w-md text-sm leading-6 text-white/45">Insira o código da partida e encontre seus amigos direto na arena.</p>
              <div className="mt-6 flex gap-2.5">
                <div className="relative min-w-0 flex-1">
                  <input
                    value={codigo}
                    onChange={(e) => setCodigo(e.target.value.toUpperCase())}
                    onKeyDown={(e) => { if (e.key === "Enter") entrarNaSala(); }}
                    placeholder="DIGITE O CÓDIGO"
                    maxLength={6}
                    aria-label="Código da sala"
                    className="h-13 w-full rounded-xl border border-white/10 bg-[#090b18]/80 px-4 text-sm font-extrabold tracking-[0.2em] text-white outline-none transition placeholder:text-white/25 focus:border-violet-200/50 focus:ring-4 focus:ring-violet-300/[0.08]"
                  />
                </div>
                <button
                  onClick={() => (!estaLogado || emailNaoVerificado) ? tratarAcesso() : entrarNaSala()}
                  disabled={estaLogado && !emailNaoVerificado && (!codigo.trim() || loading)}
                  aria-label="Entrar na sala"
                  className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-xl bg-violet-200 text-[#171126] transition hover:-translate-y-0.5 hover:bg-white disabled:cursor-not-allowed disabled:opacity-35 cursor-pointer"
                >
                  {!estaLogado ? <ArrowRight size={20} /> : emailNaoVerificado ? <Mail size={19} /> : <ArrowRight size={20} />}
                </button>
              </div>
            </div>
          </section>

          <button
            onClick={abrirCriacao}
            className="group relative flex min-h-[230px] cursor-pointer flex-col overflow-hidden rounded-[26px] border border-orange-200/20 bg-gradient-to-br from-[#38212c] via-[#241827] to-[#171323] p-5 text-left transition duration-300 hover:-translate-y-1 hover:border-orange-100/40 sm:p-7"
          >
            <div aria-hidden="true" className="absolute -right-10 -top-16 h-56 w-56 rounded-full bg-orange-400/15 blur-[80px] transition group-hover:bg-fuchsia-400/20" />
            <div className="relative flex w-full items-start justify-between">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-orange-100/15 bg-orange-200/10 text-orange-100">
                <Plus size={24} />
              </div>
              <span className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-white/55 transition group-hover:translate-x-1 group-hover:border-orange-100/20 group-hover:text-orange-100">
                <ArrowRight size={18} />
              </span>
            </div>
            <div className="relative mt-auto pt-7">
              <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-orange-100/50">Monte sua própria disputa</p>
              <h2 className="mt-2 text-2xl font-black tracking-tight">{!estaLogado ? "Entre para jogar" : emailNaoVerificado ? "Verifique seu e-mail" : "Criar uma sala"}</h2>
              <p className="mt-2 max-w-sm text-sm leading-6 text-white/45">
                {!estaLogado ? "Faça login para criar partidas e desafiar outros jogadores." : emailNaoVerificado ? "Confirme seu e-mail para liberar as partidas." : "Escolha as regras, reúna os jogadores e dê início à batalha."}
              </p>
            </div>
          </button>
        </div>

        {/* PROGRESSO DO JOGADOR */}
        <section className="grid ">
          <button
            onClick={() => {
              if (!estaLogado) {
                setLoading(true);
                router.push("/login");
                return;
              }
              setLoading(true);
              router.push("/perfil");
            }}
            className="group cursor-pointer relative overflow-hidden rounded-[24px] border border-amber-200/15 bg-gradient-to-br from-[#292033] to-[#171525] p-5 text-left transition hover:border-amber-200/30 sm:p-6"
          >
            <div aria-hidden="true" className="absolute -right-10 -top-12 h-44 w-44 rounded-full bg-amber-300/10 blur-[70px]" />
            <div className="relative flex items-start justify-between gap-4">
              <div className="flex min-w-0 gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-amber-200/15 bg-amber-200/[0.08] text-amber-100"><Trophy size={22} /></div>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-amber-100/45">Sua progressão</p>
                  <h2 className="mt-1 text-xl font-black">{!estaLogado ? "Descubra sua patente" : loadingUsuario ? "Carregando patente..." : usuario?.patente?.nome ?? "Sem classificação"}</h2>
                  {!estaLogado ? (
                    <p className="mt-2 text-sm leading-6 text-white/40">Entre para acompanhar seus resultados e avançar no ranking.</p>
                  ) : usuario?.patente ? (
                    <>
                      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                        <span className="text-xs font-bold text-amber-100">{usuario.pontuacao.toLocaleString("pt-BR")} pontos</span>
                        <span className="text-[10px] text-white/35">{usuario.proximaPatente ? `Próxima: ${usuario.proximaPatente.nome}` : "Patente máxima"}</span>
                      </div>
                      <div className="mt-2.5 h-2 max-w-xl overflow-hidden rounded-full bg-white/10">
                        <div className="h-full rounded-full bg-gradient-to-r from-amber-300 to-orange-300 transition-all duration-700" style={{ width: `${Math.max(0, Math.min(100, usuario.progresso))}%` }} />
                      </div>
                    </>
                  ) : (
                    <p className="mt-2 text-sm leading-6 text-white/40">Jogue partidas para começar a construir sua classificação.</p>
                  )}
                </div>
              </div>
              <span className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-white/55 transition group-hover:translate-x-1 group-hover:border-orange-100/20 group-hover:text-orange-100">
                <ArrowRight size={18} />
              </span>            </div>
          </button>

        </section>

        {/* SALAS: listagem unificada */}
        <section id="salas" className="scroll-mt-24  mt-5 relative overflow-hidden rounded-[28px] border border-white/[0.09] bg-[#101221]/90 shadow-[0_25px_90px_rgba(0,0,0,.22)] backdrop-blur-xl">
          <div aria-hidden="true" className="absolute right-[-5rem] top-[-8rem] h-72 w-72 rounded-full bg-violet-500/[0.09] blur-[100px]" />
          <div className="relative border-b border-white/[0.07] p-5 sm:p-7">
            <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-cyan-200/15 bg-cyan-200/[0.08] text-cyan-100">
                    <Swords size={20} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2.5">
                      <h2 className="text-2xl font-black tracking-tight">Central de salas</h2>
                      <span className="rounded-lg border border-white/10 bg-white/[0.04] px-2.5 py-1 text-xs font-extrabold tabular-nums text-white/65">{estaLogado ? totalSalasUnicas : "—"}</span>
                    </div>
                    <p className="mt-1 text-xs text-white/40 sm:text-sm">Partidas abertas e suas batalhas, em um só lugar.</p>
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row xl:w-[460px]">
                <div className="relative min-w-0 flex-1">
                  <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" />
                  <input
                    value={busca}
                    onChange={(event) =>
                      setBusca(event.target.value.slice(0, LIMITE_CARACTERES_BUSCA))
                    }
                    maxLength={LIMITE_CARACTERES_BUSCA}
                    placeholder="Buscar sala, código ou ID..."
                    aria-label="Buscar salas por nome, código ou identificador"
                    className="h-11 w-full rounded-xl border border-white/10 bg-[#090b17]/80 pl-10 pr-10 text-sm text-white outline-none transition placeholder:text-white/25 focus:border-cyan-200/35 focus:ring-4 focus:ring-cyan-200/[0.05]"
                  />
                  {busca && <button type="button" onClick={() => setBusca("")} aria-label="Limpar pesquisa" className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white cursor-pointer"><X size={15} /></button>}
                </div>
                <button type="button" onClick={() => { const currentToken = Cookies.get("token"); if (currentToken) buscarSalas(currentToken); }} disabled={!estaLogado || loadingSalas} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.035] px-4 text-xs font-bold text-white/65 transition hover:bg-white/[0.07] hover:text-white disabled:opacity-40 cursor-pointer">
                  <RefreshCw size={14} className={loadingSalas ? "animate-spin" : ""} />
                  Atualizar
                </button>
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-3 border-t border-white/[0.06] pt-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-wrap items-center gap-1.5 rounded-2xl border border-white/[0.06] bg-black/15 p-1">
                {([
                  { id: "TODAS", label: "Todas", count: totalSalasUnicas },
                  { id: "DISPONIVEIS", label: "Disponíveis", count: salasAbertas.length },
                  ...(estaLogado ? [{ id: "MINHAS", label: "Minhas salas", count: minhasSalas.length }] : []),
                ] as { id: FiltroSalas; label: string; count: number }[]).map((item) => (
                  <button key={item.id} type="button" onClick={() => setFiltroSalas(item.id)} className={`cursor-pointer inline-flex items-center gap-2 rounded-xl px-3.5 py-2.5 text-xs font-extrabold transition sm:text-sm ${filtroSalas === item.id ? "bg-white text-[#101120] shadow-lg shadow-black/10" : "text-white/45 hover:bg-white/[0.05] hover:text-white/85"}`}>
                    {item.label}
                    <span className={`rounded-md px-1.5 py-0.5 text-[10px] tabular-nums ${filtroSalas === item.id ? "bg-black/[0.07] text-black/60" : "bg-white/[0.06] text-white/35"}`}>{item.count}</span>
                  </button>
                ))}
              </div>
              <p className="text-[11px] font-medium text-white/30">
                {loadingSalas ? "Sincronizando partidas..." : `${salasExibidas.length} ${salasExibidas.length === 1 ? "sala encontrada" : "salas encontradas"}`}
              </p>
            </div>
          </div>

          <div className="relative p-4 sm:p-6">
            {!estaLogado ? (
              <div className="flex min-h-52 flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 bg-white/[0.015] px-5 py-9 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-violet-200/15 bg-violet-300/[0.08] text-violet-100"><Shield size={24} /></div>
                <p className="mt-4 text-base font-black">Sua próxima batalha está esperando</p>
                <p className="mt-1 max-w-sm text-sm leading-6 text-white/40">Entre na sua conta para encontrar partidas e gerenciar suas próprias salas.</p>
                <button onClick={tratarAcesso} className="mt-5 rounded-xl bg-white px-4 py-2.5 text-xs font-black text-[#111222] transition hover:bg-violet-100 cursor-pointer">Fazer login <ArrowRight className="ml-1 inline" size={14} /></button>
              </div>
            ) : loadingSalas && salas.length === 0 ? (
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {[1, 2, 3].map((item) => <div key={item} className="h-48 animate-pulse rounded-2xl border border-white/[0.05] bg-white/[0.025]" />)}
              </div>
            ) : salasExibidas.length === 0 ? (
              <div className="flex min-h-52 flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 bg-white/[0.015] px-5 py-9 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.035] text-white/40">
                  {busca ? <Search size={23} /> : <Swords size={23} />}
                </div>
                <p className="mt-4 text-base font-black text-white/80">
                  {busca ? "Nenhuma sala encontrada" : filtroSalas === "MINHAS" ? "Sua arena ainda está vazia" : filtroSalas === "DISPONIVEIS" ? "Nenhuma partida aberta agora" : "Ainda não há salas para mostrar"}
                </p>
                <p className="mt-1 max-w-md text-sm leading-6 text-white/40">
                  {busca ? "Experimente outro nome, código ou identificador." : filtroSalas === "MINHAS" ? "Crie sua primeira sala e reúna os jogadores." : "Você pode criar uma nova partida e ser o primeiro a entrar na arena."}
                </p>
                <div className="mt-5 flex flex-wrap justify-center gap-2">
                  {busca && <button type="button" onClick={() => setBusca("")} className="rounded-xl border border-white/10 px-4 py-2.5 text-xs font-bold text-white/65 hover:bg-white/[0.05] cursor-pointer">Limpar busca</button>}
                  {filtroSalas !== "TODAS" && <button type="button" onClick={() => setFiltroSalas("TODAS")} className="rounded-xl border border-white/10 px-4 py-2.5 text-xs font-bold text-white/65 hover:bg-white/[0.05] cursor-pointer">Ver todas</button>}
                  <button type="button" onClick={abrirCriacao} className="rounded-xl bg-violet-200 px-4 py-2.5 text-xs font-black text-[#161126] transition hover:bg-white cursor-pointer"><Plus className="mr-1 inline" size={14} /> Criar sala</button>
                </div>
              </div>
            ) : (
              <>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {salasPaginadas.map((sala) => {
                  const minhaSala = Boolean(usuario && Number(sala.criadorId) === Number(usuario.id));
                  const encerrada = sala.status === "FINALIZADA" || sala.status === "ENCERRADA";
                  const emAndamento = sala.status === "ANDAMENTO" || sala.status === "EM_ANDAMENTO";
                  const disponivel = sala.status === "ABERTA";
                  const ocupacao = Math.min(100, Math.round(((sala._count?.jogadores ?? 0) / Math.max(sala.maxJogadores, 1)) * 100));

                  return (
                    <article key={sala.id} className="group relative flex min-w-0 flex-col overflow-hidden rounded-[22px] border border-white/[0.08] bg-gradient-to-br from-[#171a2d] to-[#0e1020] transition duration-300 hover:-translate-y-1 hover:border-violet-200/25 hover:shadow-[0_18px_45px_rgba(0,0,0,.22)]">
                      <div className={`h-1 w-full ${emAndamento ? "bg-gradient-to-r from-amber-300 to-orange-400" : encerrada ? "bg-gradient-to-r from-fuchsia-400 to-violet-400" : "bg-gradient-to-r from-emerald-300 to-cyan-300"}`} />
                      <div className="flex flex-1 flex-col p-4 sm:p-5">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex min-w-0 items-center gap-3">
                            <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-[15px] border ${emAndamento ? "border-amber-200/15 bg-amber-200/[0.07] text-amber-100" : encerrada ? "border-fuchsia-200/15 bg-fuchsia-200/[0.07] text-fuchsia-100" : "border-emerald-200/15 bg-emerald-200/[0.07] text-emerald-100"}`}>
                              {emAndamento ? <Zap size={19} /> : encerrada ? <CheckCircle2 size={19} /> : <Swords size={19} />}
                            </div>
                            <div className="min-w-0">
                              <h3 className="truncate text-sm font-black text-white/90">{sala.nome}</h3>
                              <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.15em] text-white/30">ARENA #{sala.id}</p>
                            </div>
                          </div>
                          <span className={`shrink-0 rounded-lg px-2 py-1.5 text-[9px] font-black uppercase tracking-wider ${emAndamento ? "bg-amber-200/10 text-amber-100" : encerrada ? "bg-fuchsia-200/10 text-fuchsia-100" : disponivel ? "bg-emerald-200/10 text-emerald-100" : "bg-white/[0.07] text-white/50"}`}>
                            {emAndamento ? "Em andamento" : encerrada ? "Finalizada" : disponivel ? "Aberta" : sala.status.replaceAll("_", " ")}
                          </span>
                        </div>

                        <div className="mt-5 rounded-xl border border-white/[0.06] bg-black/15 p-3.5">
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <p className="text-[9px] font-extrabold uppercase tracking-[0.18em] text-white/30">Código de acesso</p>
                              <p className="mt-1.5 font-mono text-lg font-black tracking-[0.22em] text-violet-100">{sala.codigo}</p>
                            </div>
                            {minhaSala && <span className="rounded-lg border border-violet-200/15 bg-violet-200/[0.07] px-2 py-1 text-[9px] font-extrabold text-violet-100">SUA SALA</span>}
                          </div>
                          <div className="mt-3 flex items-center justify-between text-[11px]">
                            <span className="flex items-center gap-1.5 text-white/40"><Users size={13} /> Jogadores</span>
                            <span className="font-bold tabular-nums text-white/75">{sala._count?.jogadores ?? 0}<span className="mx-1 text-white/25">/</span>{sala.maxJogadores}</span>
                          </div>
                          <div className="mt-2 h-1 overflow-hidden rounded-full bg-white/[0.07]">
                            <div className={`h-full rounded-full transition-all ${emAndamento ? "bg-amber-300" : "bg-cyan-200"}`} style={{ width: `${ocupacao}%` }} />
                          </div>
                        </div>

                        <div className="mt-auto pt-4">
                          {minhaSala ? (
                            encerrada ? (
                              <button type="button" onClick={() => reabrirSala(sala.id)} disabled={loading} className="flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-violet-200/15 bg-violet-200/[0.09] text-xs font-black text-violet-100 transition hover:bg-violet-200/[0.16] disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer">
                                <RefreshCw size={14} /> Reabrir batalha
                              </button>
                            ) : (
                              <button type="button" onClick={() => {
                                if (emailNaoVerificado && usuario) {
                                  setLoading(true);
                                  router.push(`/verificar-email?email=${encodeURIComponent(usuario.email)}`);
                                  return;
                                }
                                setCodigo(sala.codigo);
                                if (emAndamento) router.push(`/sala/entrar?codigo=${sala.codigo}`);
                              }} className="flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.045] text-xs font-black text-white/75 transition hover:border-white/20 hover:bg-white/[0.08] hover:text-white cursor-pointer">
                                {emailNaoVerificado ? <><Mail size={14} /> Verificar e-mail</> : <>{emAndamento ? <Clock3 size={14} /> : <ArrowRight size={14} />}{emAndamento ? "Continuar sala" : "Selecionar sala"}</>}
                              </button>
                            )
                          ) : disponivel ? (
                            <button type="button" onClick={() => {
                              if (!estaLogado || emailNaoVerificado) {
                                tratarAcesso();
                                return;
                              }
                              entrarDiretoNaSala(sala);
                            }} className="flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-white text-xs font-black text-[#101120] transition hover:bg-cyan-100 cursor-pointer">
                              Entrar na partida <ArrowRight size={14} />
                            </button>
                          ) : (
                            <div className="flex h-10 items-center justify-center gap-2 rounded-xl bg-white/[0.025] text-xs font-semibold text-white/30">
                              <Shield size={13} /> Sala indisponível para entrada
                            </div>
                          )}
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
              {totalPaginasSalas > 1 && (
                <div className="mt-6 flex flex-col gap-3 border-t border-white/[0.07] pt-5 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-xs text-white/40">
                    Mostrando{" "}
                    <span className="font-bold text-white/75">
                      {(paginaSalas - 1) * SALAS_POR_PAGINA + 1}–
                      {Math.min(paginaSalas * SALAS_POR_PAGINA, salasExibidas.length)}
                    </span>{" "}
                    de{" "}
                    <span className="font-bold text-white/75">{salasExibidas.length}</span>{" "}
                    salas
                  </p>
                  <div className="flex items-center justify-between gap-2 sm:justify-end">
                    <button
                      type="button"
                      onClick={() => setPaginaSalas((pagina) => Math.max(1, pagina - 1))}
                      disabled={paginaSalas === 1}
                      className="rounded-xl border border-white/10 px-3.5 py-2.5 text-xs font-bold text-white/70 transition hover:bg-white/[0.06] disabled:cursor-not-allowed disabled:opacity-30 cursor-pointer"
                    >
                      Anterior
                    </button>
                    <span className="min-w-[88px] text-center text-xs font-bold tabular-nums text-white/55">
                      Página {paginaSalas} de {totalPaginasSalas}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setPaginaSalas((pagina) => Math.min(totalPaginasSalas, pagina + 1))
                      }
                      disabled={paginaSalas === totalPaginasSalas}
                      className="rounded-xl border border-white/10 px-3.5 py-2.5 text-xs font-bold text-white/70 transition hover:bg-white/[0.06] disabled:cursor-not-allowed disabled:opacity-30 cursor-pointer"
                    >
                      Próxima
                    </button>
                  </div>
                </div>
              )}
              </>
            )}
          </div>
        </section>

      </section>

      <footer className="relative mt-8 border-t border-white/[0.08] bg-[#090a14]/80 px-4 py-7 sm:px-6">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-center gap-3 text-center sm:flex-row sm:text-left">
          <p className="text-[11px] text-white/30">© {new Date().getFullYear()} QuizRoyale. Todos os direitos reservados.</p>
        </div>
      </footer>
    </main>
  );
}
