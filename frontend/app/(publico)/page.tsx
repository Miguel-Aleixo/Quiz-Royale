"use client";

import {
  ArrowRight,
  Crown,
  Gamepad2,
  History,
  Plus,
  RefreshCw,
  Search,
  Shield,
  Swords,
  Tags,
  Trophy,
  Users,
  Zap,
  Mail,
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
  _count?: {
    jogadores: number;
    rodadas: number;
  };
}

interface Pergunta {
  id: number;
  enunciado: string;
  temaId: number;
}

const glassCard =
  "border border-white/10 bg-[#14172a]/90 shadow-[0_18px_55px_rgba(4,7,20,0.28)]";

export default function Home() {
  const router = useRouter();
  const API = process.env.NEXT_PUBLIC_API;

  const [busca, setBusca] = useState("");

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

  /*
   * ESTADO DE LOGIN
   */
  const estaLogado = mounted && Boolean(token);

  /*
   * ESTADO DE VERIFICAÇÃO
   */
  const emailNaoVerificado =
    estaLogado && usuario !== null && !usuario.emailVerificado;

  /*
   * FUNÇÃO CENTRAL DE ACESSO
   *
   * Não logado:
   * -> login
   *
   * Logado sem e-mail verificado:
   * -> verificar e-mail
   *
   * Logado + verificado:
   * -> ação normal
   */
  function tratarAcesso() {
    if (!estaLogado) {
      setLoading(true);
      router.push("/login");
      return;
    }

    if (emailNaoVerificado && usuario) {
      setLoading(true);

      router.push(
        `/verificar-email?email=${encodeURIComponent(usuario.email)}`,
      );

      return;
    }
  }

  /*
   * BUSCAR USUÁRIO
   */
  async function buscarUsuario(currentToken: string) {
    try {
      setLoadingUsuario(true);

      const partes = currentToken.split(".");

      if (partes.length !== 3) {
        throw new Error("Token inválido.");
      }

      const payload = JSON.parse(atob(partes[1]));

      const id = payload.sub;

      if (!id) {
        throw new Error("Usuário não encontrado no token.");
      }

      const res = await fetch(`${API}/usuario/${id}`, {
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
            : data.message || "Erro ao buscar usuário.",
        );
      }

      setUsuario(data);
    } catch (error) {
      console.error("Erro ao buscar usuário:", error);

      toast.error(
        error instanceof Error
          ? error.message
          : "Não foi possível carregar seu usuário.",
      );
    } finally {
      setLoadingUsuario(false);
    }
  }

  /*
   * BUSCAR SALAS
   */
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
            : data.message || "Erro ao buscar salas.",
        );
      }

      setSalas(data);
    } catch (error) {
      console.error("Erro ao buscar salas:", error);

      toast.error(
        error instanceof Error
          ? error.message
          : "Não foi possível carregar as salas.",
      );
    } finally {
      setLoadingSalas(false);
    }
  }

  /*
   * BUSCAR PERGUNTAS
   */
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
            : data.message || "Erro ao buscar perguntas.",
        );
      }

      setPerguntas(data);
    } catch (error) {
      console.error("Erro ao buscar perguntas:", error);

      toast.error(
        error instanceof Error
          ? error.message
          : "Não foi possível carregar as perguntas.",
      );
    } finally {
      setLoadingPerguntas(false);
    }
  }

  /*
   * INICIALIZAÇÃO
   */
  useEffect(() => {
    const currentToken = Cookies.get("token");

    setToken(currentToken);
    setMounted(true);

    if (!currentToken) {
      return;
    }

    buscarUsuario(currentToken);
    buscarSalas(currentToken);
    buscarPerguntas(currentToken);
  }, []);

  /*
   * SALAS ABERTAS
   */
  const salasAbertas = useMemo(() => {
    const termo = busca.trim().toLowerCase();

    return salas.filter((sala) => {
      if (sala.status !== "ABERTA") {
        return false;
      }

      if (!termo) {
        return true;
      }

      return (
        sala.nome.toLowerCase().includes(termo) ||
        sala.codigo.toLowerCase().includes(termo) ||
        String(sala.id).includes(termo)
      );
    });
  }, [salas, busca]);

  /*
   * MINHAS SALAS
   */
  const minhasSalas = useMemo(() => {
    if (!usuario) {
      return [];
    }

    return salas
      .filter((sala) => Number(sala.criadorId) === Number(usuario.id))
      .sort((a, b) => b.id - a.id);
  }, [salas, usuario]);

  /*
   * TOTAL DE JOGADORES
   */
  const jogadoresNasSalas = useMemo(
    () =>
      salas.reduce((total, sala) => total + (sala._count?.jogadores ?? 0), 0),
    [salas],
  );

  /*
   * ENTRAR NA SALA
   */
  async function entrarNaSala() {
    try {
      if (!estaLogado) {
        tratarAcesso();
        return;
      }

      if (emailNaoVerificado) {
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
        body: JSON.stringify({
          codigo: codigoFormatado,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          Array.isArray(data.message)
            ? data.message.join(", ")
            : data.message || "Erro ao entrar na sala.",
        );
      }

      toast.success("Você entrou na sala!");

      router.push(`/sala/entrar?codigo=${codigoFormatado}`);
    } catch (error) {
      console.error("Erro ao entrar na sala:", error);

      toast.error(
        error instanceof Error
          ? error.message
          : "Não foi possível entrar na sala.",
      );
    } finally {
      setLoading(false);
    }
  }

  /*
   * ENTRAR DIRETO NA SALA
   */
  async function entrarDiretoNaSala(sala: Sala) {
    try {
      if (!estaLogado) {
        tratarAcesso();
        return;
      }

      if (emailNaoVerificado) {
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
        body: JSON.stringify({
          codigo: sala.codigo,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          Array.isArray(data.message)
            ? data.message.join(", ")
            : data.message || "Erro ao entrar na sala.",
        );
      }

      toast.success("Você entrou na sala!");

      router.push(`/sala/entrar?codigo=${sala.codigo}`);
    } catch (error) {
      console.error("Erro ao entrar na sala:", error);

      toast.error(
        error instanceof Error
          ? error.message
          : "Não foi possível entrar na sala.",
      );
    } finally {
      setLoading(false);
    }
  }

  /*
   * REABRIR SALA
   */
  async function reabrirSala(salaId: number) {
    try {
      if (!estaLogado) {
        tratarAcesso();
        return;
      }

      if (emailNaoVerificado) {
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
            : data.message || "Não foi possível reabrir a sala.",
        );
      }

      toast.success("Sala reaberta! Um novo código foi gerado.");

      await buscarSalas(currentToken);
    } catch (error) {
      console.error("Erro ao reabrir sala:", error);

      toast.error(
        error instanceof Error
          ? error.message
          : "Não foi possível reabrir a sala.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#070914] text-white selection:bg-fuchsia-300/30">
      <LoadingOverlay
        show={loading || loadingPerguntas || loadingSalas || loadingUsuario}
      />

      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-40 -top-44 h-[34rem] w-[34rem] rounded-full bg-fuchsia-600/20 blur-[120px]" />
        <div className="absolute right-[-10rem] top-20 h-[30rem] w-[30rem] rounded-full bg-cyan-400/10 blur-[120px]" />
        <div className="absolute bottom-[-16rem] left-1/3 h-[34rem] w-[34rem] rounded-full bg-violet-600/14 blur-[130px]" />
        <div className="absolute inset-0 opacity-[0.035] [background-image:linear-gradient(rgba(255,255,255,.8)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.8)_1px,transparent_1px)] [background-size:56px_56px]" />
      </div>

      <Header nome={usuario?.nome} patente={usuario?.patente?.nome} />

      <section className="relative z-10 mx-auto max-w-7xl px-5 pb-14 pt-24 sm:px-8 lg:pt-28">
        <div className="mb-10 flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-fuchsia-300/15 bg-fuchsia-300/[0.06] px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.22em] text-fuchsia-100/70">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-300 shadow-[0_0_12px_rgba(110,231,183,.9)]" />
              Arena online
            </div>
            <h1 className="max-w-2xl text-4xl font-black leading-[0.98] tracking-[-0.055em] sm:text-6xl lg:text-7xl">
              Sua próxima
              <span className="block bg-gradient-to-r from-fuchsia-200 via-orange-200 to-cyan-200 bg-clip-text pb-2 text-transparent">
                vitória começa aqui.
              </span>
            </h1>
            <p className="mt-5 max-w-xl text-sm leading-7 text-white/45 sm:text-base">
              Entre em uma batalha, desafie seus amigos e suba no ranking
              respondendo perguntas em tempo recorde.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:flex sm:gap-3">
            <div className="rounded-2xl border border-white/10 bg-white/[0.045] px-4 py-3 backdrop-blur-xl">
              <p className="text-[9px] font-black uppercase tracking-[0.18em] text-white/30">
                Jogadores ativos
              </p>
              <p className="mt-1 text-xl font-black text-cyan-100">
                {estaLogado ? jogadoresNasSalas : "—"}
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.045] px-4 py-3 backdrop-blur-xl">
              <p className="text-[9px] font-black uppercase tracking-[0.18em] text-white/30">
                Perguntas
              </p>
              <p className="mt-1 text-xl font-black text-amber-100">
                {estaLogado && !loadingPerguntas ? perguntas.length : "—"}
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-[1.15fr_.85fr]">
          <div className="group relative overflow-hidden rounded-[30px] border border-violet-300/20 bg-gradient-to-br from-[#1b1b46] via-[#15152f] to-[#101425] p-6 shadow-[0_24px_70px_rgba(49,46,129,.25)] transition duration-300 hover:-translate-y-1 hover:border-violet-200/45 sm:p-8">
            <div className="absolute -right-16 -top-20 h-64 w-64 rounded-full bg-fuchsia-400/15 blur-[90px] transition duration-500 group-hover:bg-fuchsia-400/25" />
            <div className="relative flex h-full flex-col">
              <div className="flex items-start justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-violet-100 ring-1 ring-inset ring-white/10">
                  <Gamepad2 size={24} />
                </div>
                <span className="rounded-full border border-white/10 bg-black/10 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.18em] text-violet-100/60">
                  Código de acesso
                </span>
              </div>
              <div className="mt-8">
                <h2 className="text-2xl font-black tracking-tight sm:text-3xl">
                  Entrar em uma sala
                </h2>
                <p className="mt-2 max-w-sm text-sm leading-6 text-white/45">
                  Use o código compartilhado pelo criador da partida.
                </p>
              </div>
              <div className="mt-7 flex gap-3">
                <input
                  value={codigo}
                  onChange={(e) => setCodigo(e.target.value.toUpperCase())}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") entrarNaSala();
                  }}
                  placeholder="CÓDIGO DA SALA"
                  maxLength={6}
                  aria-label="Código da sala"
                  className="h-14 min-w-0 flex-1 rounded-2xl border border-white/10 bg-[#090b19]/70 px-4 text-sm font-black tracking-[0.2em] text-white outline-none transition placeholder:text-white/20 focus:border-violet-300/70 focus:ring-4 focus:ring-violet-400/10"
                />
                <button
                  onClick={() => {
                    if (!estaLogado || emailNaoVerificado) {
                      tratarAcesso();
                      return;
                    }
                    entrarNaSala();
                  }}
                  disabled={
                    !estaLogado || emailNaoVerificado
                      ? false
                      : !codigo.trim() || loading
                  }
                  aria-label={
                    !estaLogado
                      ? "Entrar"
                      : emailNaoVerificado
                        ? "Verificar e-mail"
                        : "Entrar na sala"
                  }
                  className={`flex h-14 w-14 shrink-0 cursor-pointer items-center justify-center rounded-2xl transition hover:-translate-y-0.5 hover:shadow-lg disabled:cursor-not-allowed ${!estaLogado ? "bg-white/10 text-white/60 hover:bg-white/15" : emailNaoVerificado ? "bg-amber-400/10 text-amber-300 hover:bg-amber-400/20" : "bg-fuchsia-300 text-[#171022] hover:bg-fuchsia-200 hover:shadow-fuchsia-500/20 disabled:opacity-30"}`}
                >
                  {!estaLogado ? (
                    <ArrowRight size={20} />
                  ) : emailNaoVerificado ? (
                    <Mail size={20} />
                  ) : (
                    <ArrowRight size={20} />
                  )}
                </button>
              </div>
            </div>
          </div>

          <button
            onClick={() => {
              if (!estaLogado) {
                setLoading(true);
                router.push("/login");
                return;
              }
              if (emailNaoVerificado && usuario) {
                setLoading(true);
                router.push(
                  `/verificar-email?email=${encodeURIComponent(usuario.email)}`,
                );
                return;
              }
              setLoading(true);
              router.push("/sala/criar");
            }}
            className="group relative cursor-pointer overflow-hidden rounded-[30px] border border-orange-300/20 bg-gradient-to-br from-[#31203a] to-[#1b1526] p-6 text-left shadow-[0_24px_70px_rgba(154,52,18,.18)] transition duration-300 hover:-translate-y-1 hover:border-orange-200/45 sm:p-8"
          >
            <div className="absolute -right-14 -top-16 h-60 w-60 rounded-full bg-orange-400/15 blur-[85px] transition group-hover:bg-fuchsia-400/25" />
            <div className="relative flex h-full flex-col">
              <div className="flex items-start justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-300/15 text-orange-100 ring-1 ring-inset ring-orange-200/15">
                  <Plus size={24} />
                </div>
                <ArrowRight
                  size={21}
                  className="text-white/30 transition group-hover:translate-x-1 group-hover:text-orange-100"
                />
              </div>
              <div className="mt-auto pt-12">
                <p className="mb-2 text-[10px] font-black uppercase tracking-[0.2em] text-orange-200/55">
                  Jogue do seu jeito
                </p>
                <h2 className="text-2xl font-black tracking-tight sm:text-3xl">
                  {!estaLogado
                    ? "Entre para jogar"
                    : emailNaoVerificado
                      ? "Verifique seu e-mail"
                      : "Criar uma sala"}
                </h2>
                <p className="mt-2 max-w-sm text-sm leading-6 text-white/45">
                  {!estaLogado
                    ? "Faça login para criar salas e participar das batalhas."
                    : emailNaoVerificado
                      ? "Confirme seu e-mail para poder criar e participar das batalhas."
                      : "Monte sua própria batalha, escolha os jogadores e defina o ritmo do jogo."}
                </p>
              </div>
            </div>
          </button>
        </div>

        <section className="mt-5 overflow-hidden rounded-[30px] border border-violet-200/15 bg-[#111426]/90 p-5 shadow-[0_24px_70px_rgba(30,41,100,.2)] sm:p-7">
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-400/15 text-violet-100">
                <Swords size={20} />
              </div>
              <div>
                <h2 className="text-xl font-black tracking-tight">
                  Salas abertas
                </h2>
                <p className="mt-1 text-xs text-white/35">
                  Partidas esperando novos competidores.
                </p>
              </div>
            </div>
            <div className="flex w-full items-center gap-3 sm:w-auto">
              <div className="relative w-full sm:w-64">
                <Search
                  size={16}
                  className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-white/25"
                />
                <input
                  value={busca}
                  onChange={(event) => setBusca(event.target.value)}
                  placeholder="Buscar por nome..."
                  className="h-11 w-full rounded-xl border border-white/10 bg-[#090b19] pl-10 pr-9 text-sm text-white outline-none placeholder:text-white/20 transition focus:border-violet-300/50 focus:ring-4 focus:ring-violet-400/[0.08]"
                />
                {busca && (
                  <button
                    type="button"
                    onClick={() => setBusca("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-xs font-bold text-white/30 hover:text-white/70"
                  >
                    ×
                  </button>
                )}
              </div>
              <span className="shrink-0 rounded-xl border border-violet-300/15 bg-violet-400/10 px-3 py-2.5 text-xs font-bold text-violet-100">
                {!estaLogado
                  ? "—"
                  : loadingSalas
                    ? "—"
                    : salasAbertas.length === 1
                      ? "1 disponível"
                      : `${salasAbertas.length} disponíveis`}
              </span>
            </div>
          </div>
          {!estaLogado ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 bg-white/[0.015] p-7 text-center">
              <p className="text-sm font-semibold text-white/45">
                Entre para visualizar as salas.
              </p>
              <p className="mt-1 text-xs text-white/25">
                Faça login para entrar em uma batalha.
              </p>
              <button
                onClick={tratarAcesso}
                className="mt-4 cursor-pointer rounded-xl bg-violet-400/10 px-4 py-2.5 text-xs font-bold text-violet-200 transition hover:bg-violet-400/20"
              >
                Entrar agora
              </button>
            </div>
          ) : loadingSalas ? (
            <div className="grid gap-3 md:grid-cols-3">
              {[1, 2, 3].map((item) => (
                <div
                  key={item}
                  className="h-28 animate-pulse rounded-2xl bg-white/[0.04]"
                />
              ))}
            </div>
          ) : salasAbertas.length === 0 ? (
            <div className="flex min-h-28 flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 bg-white/[0.015] px-5 text-center">
              <p className="text-sm font-semibold text-white/45">
                Nenhuma sala aberta no momento.
              </p>
              <p className="mt-1 text-xs text-white/25">
                Crie uma sala e comece a primeira batalha.
              </p>
            </div>
          ) : (
            <div className="grid gap-3 md:grid-cols-3">
              {salasAbertas.map((sala) => (
                <button
                  key={sala.id}
                  onDoubleClick={() => {
                    if (!estaLogado || emailNaoVerificado) {
                      tratarAcesso();
                      return;
                    }
                    entrarDiretoNaSala(sala);
                  }}
                  onClick={() => setCodigo(sala.codigo)}
                  className="group cursor-pointer rounded-2xl border border-white/[0.08] bg-white/[0.025] p-4 text-left transition hover:-translate-y-1 hover:border-fuchsia-300/35 hover:bg-fuchsia-400/[0.06]"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="truncate text-sm font-bold text-white/85">
                      {sala.nome}
                    </span>
                    <span className="h-2 w-2 shrink-0 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,.7)]" />
                  </div>
                  <div className="mt-5 flex items-center justify-between">
                    <span className="font-mono text-xs tracking-[0.18em] text-violet-200">
                      {sala.codigo}
                    </span>
                    <span className="flex items-center gap-1 text-[11px] text-white/30">
                      <Users size={12} />
                      {sala._count?.jogadores ?? 0}/{sala.maxJogadores}
                    </span>
                  </div>
                  <div className="mt-4 h-1 overflow-hidden rounded-full bg-white/10">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-violet-400 to-fuchsia-300"
                      style={{
                        width: `${Math.min(((sala._count?.jogadores ?? 0) / sala.maxJogadores) * 100, 100)}%`,
                      }}
                    />
                  </div>
                </button>
              ))}
            </div>
          )}
        </section>

        {estaLogado && (
          <section className="mt-5 overflow-hidden rounded-[30px] border border-cyan-200/15 bg-[#0f1b29]/95 p-5 shadow-[0_24px_70px_rgba(8,145,178,.14)] sm:p-7">
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-300/15 text-cyan-200">
                  <History size={20} />
                </div>
                <div>
                  <h2 className="text-xl font-black tracking-tight">
                    Minhas salas
                  </h2>
                  <p className="mt-1 text-xs text-white/35">
                    Salas que você criou e pode abrir novamente.
                  </p>
                </div>
              </div>
              <span className="w-fit rounded-xl border border-cyan-200/15 bg-cyan-300/10 px-3 py-2.5 text-xs font-bold text-cyan-100">
                {minhasSalas.length === 1
                  ? "1 sala criada"
                  : `${minhasSalas.length} salas criadas`}
              </span>
            </div>
            {minhasSalas.length === 0 ? (
              <div className="flex min-h-28 flex-col items-center justify-center rounded-2xl border border-dashed border-cyan-300/10 bg-white/[0.02] px-5 text-center">
                <p className="text-sm font-semibold text-white/45">
                  Você ainda não criou nenhuma sala.
                </p>
                <p className="mt-1 text-xs text-white/25">
                  {emailNaoVerificado
                    ? "Verificar e-mail"
                    : "Criar minha primeira sala"}
                </p>
              </div>
            ) : (
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {minhasSalas.map((sala) => {
                  const encerrada =
                    sala.status === "FINALIZADA" || sala.status === "ENCERRADA";
                  const emAndamento =
                    sala.status === "ANDAMENTO" ||
                    sala.status === "EM_ANDAMENTO";
                  return (
                    <div
                      key={sala.id}
                      className="group relative overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0b1220]/80 p-4 transition duration-300 hover:-translate-y-1 hover:border-cyan-300/25 hover:shadow-xl hover:shadow-cyan-950/20"
                    >
                      <div
                        className={`absolute -right-10 -top-10 h-28 w-28 rounded-full blur-[45px] ${emAndamento ? "bg-amber-400/15" : encerrada ? "bg-fuchsia-400/15" : "bg-emerald-400/15"}`}
                      />
                      <div className="relative">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex min-w-0 items-center gap-3">
                            <div
                              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${emAndamento ? "bg-amber-400/10 text-amber-200" : encerrada ? "bg-fuchsia-400/10 text-fuchsia-200" : "bg-emerald-400/10 text-emerald-200"}`}
                            >
                              {emAndamento ? (
                                <Zap size={18} />
                              ) : (
                                <Swords size={18} />
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="truncate text-sm font-black text-white/90">
                                {sala.nome}
                              </p>
                              <p className="mt-0.5 text-[10px] font-bold uppercase tracking-[0.16em] text-white/25">
                                Sala #{sala.id}
                              </p>
                            </div>
                          </div>
                          <span
                            className={`shrink-0 rounded-lg px-2 py-1 text-[9px] font-black uppercase tracking-wider ${emAndamento ? "bg-amber-400/10 text-amber-200" : encerrada ? "bg-fuchsia-400/10 text-fuchsia-200" : "bg-emerald-400/10 text-emerald-200"}`}
                          >
                            {emAndamento
                              ? "Em andamento"
                              : encerrada
                                ? "Finalizada"
                                : "Aberta"}
                          </span>
                        </div>
                        <div className="mt-5 flex items-center justify-between">
                          <div>
                            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/25">
                              Código
                            </p>
                            <p className="mt-1 font-mono text-sm font-black tracking-[0.2em] text-cyan-200">
                              {sala.codigo}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/25">
                              Jogadores
                            </p>
                            <p className="mt-1 flex items-center justify-end gap-1 text-sm font-bold text-white/65">
                              <Users size={13} />
                              {sala._count?.jogadores ?? 0}/{sala.maxJogadores}
                            </p>
                          </div>
                        </div>
                        {encerrada ? (
                          <button
                            type="button"
                            onClick={() => reabrirSala(sala.id)}
                            disabled={loading}
                            className="mt-4 flex h-10 w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-300/15 via-violet-300/15 to-fuchsia-300/15 text-xs font-black text-cyan-100 ring-1 ring-inset ring-cyan-300/15 transition hover:-translate-y-0.5 hover:from-cyan-300/25 disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            <RefreshCw size={14} />
                            Abrir novamente
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              if (emailNaoVerificado && usuario) {
                                setLoading(true);
                                router.push(
                                  `/verificar-email?email=${encodeURIComponent(usuario.email)}`,
                                );
                                return;
                              }
                              setCodigo(sala.codigo);
                            }}
                            className="mt-4 flex h-10 w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-white/[0.04] text-xs font-black text-white/55 ring-1 ring-inset ring-white/[0.06] transition hover:bg-white/[0.08] hover:text-white"
                          >
                            {emailNaoVerificado ? (
                              <>
                                <Mail size={14} />
                                Verificar e-mail
                              </>
                            ) : (
                              <>
                                <ArrowRight size={14} />
                                {emAndamento
                                  ? "Continuar sala"
                                  : "Selecionar sala"}
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        )}

        <div className="mt-5 grid gap-4 lg:grid-cols-[1.2fr_.8fr]">
          <div className="rounded-[30px] border border-sky-200/15 bg-[#101b2b] p-6 shadow-[0_24px_70px_rgba(14,116,144,.14)]">
            <div className="flex items-center justify-between gap-5">
              <div>
                <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-300/10 text-sky-100">
                  <Tags size={21} />
                </div>
                <h2 className="text-xl font-black tracking-tight">
                  Banco de perguntas
                </h2>
                <p className="mt-2 max-w-md text-sm leading-6 text-white/35">
                  Conteúdo disponível para criar rodadas mais variadas e
                  desafiadoras.
                </p>
              </div>
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-sky-200/15 bg-sky-300/10">
                <span className="text-2xl font-black text-sky-100">
                  {!estaLogado
                    ? "—"
                    : loadingPerguntas
                      ? "—"
                      : perguntas.length}
                </span>
              </div>
            </div>
          </div>
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
            className="group relative cursor-pointer overflow-hidden rounded-[30px] border border-amber-200/20 bg-gradient-to-br from-[#302338] to-[#1d1729] p-6 text-left shadow-[0_24px_70px_rgba(180,83,9,.15)] transition hover:-translate-y-1 hover:border-amber-200/40"
          >
            <div className="absolute -right-10 -top-10 h-36 w-36 rounded-full bg-amber-300/12 blur-[65px]" />
            <div className="relative">
              <div className="flex items-start justify-between">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-400/10 text-amber-200">
                  <Trophy size={21} />
                </div>
                <Shield size={18} className="text-amber-200/30" />
              </div>
              {!estaLogado ? (
                <>
                  <p className="mt-5 text-[10px] font-bold uppercase tracking-[0.2em] text-white/30">
                    Sua patente
                  </p>
                  <h2 className="mt-1 text-xl font-black">Entre para jogar</h2>
                  <p className="mt-2 text-sm leading-6 text-white/35">
                    Faça login para acompanhar sua patente, pontuação e
                    progresso.
                  </p>
                  <div className="mt-5 flex items-center gap-2 text-xs font-bold text-amber-200">
                    Entrar agora{" "}
                    <ArrowRight
                      size={14}
                      className="transition-transform group-hover:translate-x-1"
                    />
                  </div>
                </>
              ) : (
                <>
                  <p className="mt-5 text-[10px] font-bold uppercase tracking-[0.2em] text-white/30">
                    Sua patente
                  </p>
                  <h2 className="mt-1 text-xl font-black">
                    {loadingUsuario
                      ? "Carregando..."
                      : (usuario?.patente?.nome ?? "Sem classificação")}
                  </h2>
                  {!loadingUsuario && usuario?.patente && (
                    <>
                      <div className="mt-3 flex items-center justify-between">
                        <span className="text-xs font-semibold text-amber-200">
                          {usuario.pontuacao.toLocaleString("pt-BR")} pontos
                        </span>
                        {usuario.proximaPatente ? (
                          <span className="text-[10px] font-semibold text-white/30">
                            {usuario.proximaPatente.pontos.toLocaleString(
                              "pt-BR",
                            )}{" "}
                            pts
                          </span>
                        ) : (
                          <span className="text-[10px] font-semibold text-amber-200/60">
                            MÁXIMO
                          </span>
                        )}
                      </div>
                      <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-white/10">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-amber-300 to-orange-200 transition-all duration-700"
                          style={{ width: `${usuario.progresso}%` }}
                        />
                      </div>
                      {usuario.proximaPatente && (
                        <div className="mt-2 flex justify-between text-[10px] text-white/25">
                          <span>{usuario.patente.nome}</span>
                          <span>{usuario.proximaPatente.nome}</span>
                        </div>
                      )}
                    </>
                  )}
                </>
              )}
            </div>
          </button>
        </div>
      </section>
    </main>
  );
}
