"use client";

import {
  ArrowRight,
  Crown,
  Gamepad2,
  Plus,
  Search,
  Shield,
  Swords,
  Tags,
  Trophy,
  Users,
  Zap,
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
  "border border-white/[0.09] bg-white/[0.045] shadow-[0_20px_80px_rgba(0,0,0,0.28)] backdrop-blur-xl";

export default function Home() {
  const router = useRouter();
  const API = process.env.NEXT_PUBLIC_API;
  const [busca, setBusca] = useState('')

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

      toast.error(
        error instanceof Error
          ? error.message
          : "Não foi possível carregar seu usuário."
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

      toast.error(
        error instanceof Error
          ? error.message
          : "Não foi possível carregar as salas."
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

      toast.error(
        error instanceof Error
          ? error.message
          : "Não foi possível carregar as perguntas."
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
   * TOTAL DE JOGADORES
   */
  const jogadoresNasSalas = useMemo(
    () =>
      salas.reduce(
        (total, sala) => total + (sala._count?.jogadores ?? 0),
        0
      ),
    [salas]
  );

  /*
   * ENTRAR NA SALA
   */
  async function entrarNaSala() {
    try {
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
            : data.message || "Erro ao entrar na sala."
        );
      }

      toast.success("Você entrou na sala!");

      router.push(`/sala/entrar?codigo=${codigoFormatado}`);
    } catch (error) {
      console.error("Erro ao entrar na sala:", error);

      toast.error(
        error instanceof Error
          ? error.message
          : "Não foi possível entrar na sala."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen overflow-hidden bg-[#070711] text-white selection:bg-fuchsia-400/30">
      <LoadingOverlay show={loading || loadingPerguntas || loadingSalas || loadingUsuario} />

      {/* BACKGROUND */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-48 -top-48 h-[34rem] w-[34rem] rounded-full bg-fuchsia-600/15 blur-[110px]" />

        <div className="absolute -right-40 top-1/4 h-[30rem] w-[30rem] rounded-full bg-fuchsia-600/10 blur-[120px]" />

        <div className="absolute bottom-[-18rem] left-1/3 h-[34rem] w-[34rem] rounded-full bg-cyan-600/10 blur-[120px]" />

        <div className="absolute inset-0 opacity-[0.035] [background-image:linear-gradient(rgba(255,255,255,.8)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.8)_1px,transparent_1px)] [background-size:48px_48px]" />
      </div>

      <Header
        nome={usuario?.nome}
        patente={usuario?.patente?.nome}
      />

      <section className="relative z-10 mx-auto max-w-7xl px-5 pb-16 pt-28 sm:px-8 lg:pt-32">
        {/* HERO */}
        <div className="mb-10 flex flex-col justify-between gap-8 lg:flex-row lg:items-end">
          <div className="max-w-2xl">
           

            <h1 className="text-4xl font-black leading-[1.02] tracking-[-0.04em] sm:text-6xl">
              Pronto para
              <span className="block bg-gradient-to-r from-fuchsia-200 via-violet-200 to-cyan-200 bg-clip-text text-transparent">
                dominar a arena?
              </span>
            </h1>

            <p className="mt-5 max-w-xl text-sm leading-7 text-white/45 sm:text-base">
              Entre em uma batalha, desafie seus amigos e suba no ranking
              respondendo perguntas em tempo recorde.
            </p>
          </div>

          {/* ESTATÍSTICAS */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <div className={`${glassCard} rounded-2xl px-4 py-3`}>
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/30">
                Salas abertas
              </p>

              <p className="mt-1 text-2xl font-black text-violet-200">
                {!estaLogado
                  ? "—"
                  : loadingSalas
                    ? "—"
                    : salasAbertas.length}
              </p>
            </div>

            <div className={`${glassCard} rounded-2xl px-4 py-3`}>
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/30">
                Jogadores
              </p>

              <p className="mt-1 text-2xl font-black text-fuchsia-200">
                {!estaLogado
                  ? "—"
                  : loadingSalas
                    ? "—"
                    : jogadoresNasSalas}
              </p>
            </div>

            <div
              className={`${glassCard} col-span-2 rounded-2xl px-4 py-3 sm:col-span-1`}
            >
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/30">
                Perguntas
              </p>

              <p className="mt-1 text-2xl font-black text-amber-200">
                {!estaLogado
                  ? "—"
                  : loadingPerguntas
                    ? "—"
                    : perguntas.length}
              </p>
            </div>
          </div>
        </div>

        {/* CARDS PRINCIPAIS */}
        <div className="grid gap-5 lg:grid-cols-2">
          {/* ENTRAR EM SALA */}
          <div className="group relative overflow-hidden rounded-[2rem] border border-violet-300/20 bg-gradient-to-br from-violet-500/20 via-[#18152b] to-[#11111c] p-6 shadow-2xl shadow-violet-950/15 transition hover:-translate-y-1 hover:border-violet-300/40 sm:p-8">
            <div className="absolute -right-20 -top-20 h-56 w-56 rounded-full bg-violet-500/20 blur-[70px] transition duration-500 group-hover:bg-violet-400/30" />

            <div className="relative">
              <div className="flex items-start justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-400/15 text-violet-200 ring-1 ring-inset ring-violet-300/15 shadow-lg shadow-violet-950/20">
                  <Gamepad2 size={23} />
                </div>
                
              </div>

              <h2 className="mt-8 text-2xl font-black tracking-tight">
                Entrar em uma sala
              </h2>

              <p className="mt-2 max-w-sm text-sm leading-6 text-white/45">
                Use o código compartilhado pelo criador da partida.
              </p>

              <div className="mt-7 flex gap-3">
                <input
                  value={codigo}
                  onChange={(e) =>
                    setCodigo(e.target.value.toUpperCase())
                  }
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      entrarNaSala();
                    }
                  }}
                  placeholder="CÓDIGO DA SALA"
                  maxLength={6}
                  aria-label="Código da sala"
                  className="h-13 min-w-0 flex-1 rounded-2xl border border-white/10 bg-black/25 px-4 text-sm font-bold tracking-[0.18em] text-white outline-none transition placeholder:text-white/20 focus:border-fuchsia-300/60 focus:bg-black/35 focus:ring-4 focus:ring-fuchsia-400/10"
                />

                <button
                  onClick={entrarNaSala}
                  disabled={!estaLogado || !codigo.trim() || loading}
                  aria-label="Entrar na sala"
                  className="flex h-13 w-13 shrink-0 cursor-pointer items-center justify-center rounded-2xl bg-gradient-to-br from-fuchsia-300 to-violet-400 text-[#171022] transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-fuchsia-500/20 disabled:cursor-not-allowed disabled:opacity-30"
                >
                  <ArrowRight size={20} />
                </button>
              </div>

              {!estaLogado && (
                <button
                  onClick={() => {
                    setLoading(true);
                    router.push("/login");
                  }}
                    className="mt-4 cursor-pointer text-xs font-bold text-fuchsia-200 transition hover:text-fuchsia-100"
                >
                  Entre para participar →
                </button>
              )}
            </div>
          </div>

          {/* CRIAR SALA */}
          <button
            onClick={() => {
              setLoading(true);
              router.push(estaLogado ? "/sala/criar" : "/login");
            }}
              className="group relative cursor-pointer overflow-hidden rounded-[2rem] border border-fuchsia-300/20 bg-gradient-to-br from-fuchsia-500/15 via-[#1b1428] to-[#11111c] p-6 text-left shadow-2xl shadow-fuchsia-950/10 transition duration-300 hover:-translate-y-1 hover:border-fuchsia-300/45 hover:shadow-fuchsia-950/30 sm:p-8"
          >
            <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-fuchsia-500/15 blur-[70px] transition group-hover:bg-fuchsia-400/25" />

            <div className="relative flex h-full flex-col">
              <div className="flex items-start justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-fuchsia-400/15 text-fuchsia-200 ring-1 ring-inset ring-fuchsia-300/15">
                  <Plus size={23} />
                </div>

                <ArrowRight
                  size={21}
                  className="text-white/30 transition group-hover:translate-x-1 group-hover:text-fuchsia-200"
                />
              </div>

              <h2 className="mt-8 text-2xl font-black tracking-tight">
                {estaLogado ? "Criar uma sala" : "Entre para jogar"}
              </h2>

              <p className="mt-2 max-w-sm text-sm leading-6 text-white/45">
                {estaLogado
                  ? "Monte sua própria batalha, escolha os jogadores e defina o ritmo do jogo."
                  : "Faça login para criar salas e participar das batalhas."}
              </p>

              <div className="mt-auto flex items-center gap-2 pt-7 text-xs font-bold text-fuchsia-200">
                <Crown size={14} />

                {estaLogado
                  ? "Montar nova batalha"
                  : "Entrar agora"}
              </div>
            </div>
          </button>
        </div>

        {/* SALAS ABERTAS */}
        <section className={`${glassCard} mt-6 rounded-[2rem] p-5 transition hover:border-violet-300/20 sm:p-7`}>
          <div className="mb-6 flex items-center justify-between gap-4 w-full">
            <div>
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-400/10 text-violet-200">
                  <Swords size={18} />
                </div>

                <h2 className="text-xl font-black tracking-tight">
                  Salas abertas
                </h2>
              </div>

              <p className="mt-2 text-sm text-white/35">
                Partidas esperando novos competidores.
              </p>
            </div>

            {/* BUSCA */}
            <div className="flex w-full items-center gap-3 sm:w-auto">
              <div className="relative w-full sm:w-64">
                <Search
                  size={16}
                  className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-white/25 transition-colors"
                />

                <input
                  value={busca}
                  onChange={(event) => setBusca(event.target.value)}
                  placeholder="Buscar por nome..."
                  className="
        h-10 w-full rounded-xl
        border border-white/[0.08]
        bg-white/[0.035]
        pl-10 pr-4
        text-sm font-medium text-white
        outline-none
        placeholder:text-white/20
        transition-all duration-200
        hover:border-white/[0.14]
        hover:bg-white/[0.05]
                  focus:border-fuchsia-400/40
                  focus:bg-fuchsia-400/[0.04]
                  focus:ring-4 focus:ring-fuchsia-400/[0.06]
      "
                />

                {busca && (
                  <button
                    type="button"
                    onClick={() => setBusca("")}
                    className="cursor-pointer
          absolute right-3 top-1/2
          -translate-y-1/2
          text-xs font-bold text-white/25
          transition-colors
          hover:text-white/60
        "
                  >
                    ×
                  </button>
                )}
              </div>

              <span
                className="
      shrink-0 rounded-xl
      border border-violet-300/[0.12]
      bg-violet-400/[0.07]
      px-3 py-2
      text-xs font-bold
      text-violet-200/80
      shadow-[0_0_20px_rgba(139,92,246,0.05)]
    "
              >
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
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 bg-white/[0.015] p-4 text-center">

              <p className="text-sm font-semibold text-white/45">
                Entre para visualizar as salas.
              </p>

              <p className="mt-1 text-xs text-white/25">
                Faça login para entrar em uma batalha.
              </p>

              <button
                onClick={() => {
                  setLoading(true);
                  router.push("/login");
                }}
                className="mt-4 cursor-pointer rounded-xl bg-violet-400/10 px-4 py-2 text-xs font-bold text-violet-200 transition hover:bg-violet-400/20"
              >
                Entrar agora
              </button>
            </div>
          ) : loadingSalas ? (
            <div className="grid gap-3 md:grid-cols-3">
              {[1, 2, 3].map((item) => (
                <div
                  key={item}
                  className="h-24 animate-pulse rounded-2xl bg-white/[0.04]"
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
                  onClick={() => setCodigo(sala.codigo)}
                  className="group cursor-pointer rounded-2xl border border-white/[0.08] bg-white/[0.025] p-4 text-left transition hover:-translate-y-1 hover:border-fuchsia-300/35 hover:bg-fuchsia-400/[0.06] hover:shadow-lg hover:shadow-fuchsia-950/15"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="truncate text-sm font-bold text-white/85">
                      {sala.nome}
                    </span>

                    <span className="flex h-2 w-2 shrink-0 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,.7)]" />
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
                </button>
              ))}
            </div>
          )}
        </section>

        {/* PARTE INFERIOR */}
        <div className="mt-6 grid gap-5 lg:grid-cols-[1.35fr_1fr]">
          {/* BANCO DE PERGUNTAS */}
          <div className={`${glassCard} rounded-[2rem] p-6 sm:p-7`}>
            <div className="flex items-center justify-between gap-5">
              <div>
                <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-2xl bg-white/[0.06] text-white/70">
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

              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-fuchsia-300/15 bg-fuchsia-400/[0.07]">
                <span className="text-2xl font-black text-fuchsia-200">
                  {!estaLogado
                    ? "—"
                    : loadingPerguntas
                      ? "—"
                      : perguntas.length}
                </span>
              </div>
            </div>
          </div>

          {/* PATENTE */}
          <button
            onClick={() => {
              setLoading(true);
              router.push(estaLogado ? "/perfil" : "/login");
            }}
            className="group relative cursor-pointer overflow-hidden rounded-[2rem] border border-amber-300/15 bg-gradient-to-br from-amber-400/10 via-[#18151b] to-[#11111c] p-6 text-left transition hover:-translate-y-1 hover:border-amber-300/35 sm:p-7"
          >
            <div className="absolute -right-10 -top-10 h-36 w-36 rounded-full bg-amber-400/10 blur-[55px]" />

            <div className="relative">
              <div className="flex items-start justify-between">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-400/10 text-amber-200">
                  <Trophy size={21} />
                </div>

                <Shield size={18} className="text-amber-200/30" />
              </div>

              {!estaLogado ? (
                <>
                  <p className="mt-6 text-[10px] font-bold uppercase tracking-[0.2em] text-white/30">
                    Sua patente
                  </p>

                  <h2 className="mt-1 text-xl font-black">
                    Entre para jogar
                  </h2>

                  <p className="mt-2 text-sm leading-6 text-white/35">
                    Faça login para acompanhar sua patente, pontuação e
                    progresso.
                  </p>

                  <div className="mt-5 flex items-center gap-2 text-xs font-bold text-amber-200">
                    <span>Entrar agora</span>

                    <ArrowRight
                      size={14}
                      className="transition-transform group-hover:translate-x-1"
                    />
                  </div>
                </>
              ) : (
                <>
                  <p className="mt-6 text-[10px] font-bold uppercase tracking-[0.2em] text-white/30">
                    Sua patente
                  </p>

                  <h2 className="mt-1 text-xl font-black">
                    {loadingUsuario
                      ? "Carregando..."
                      : usuario?.patente?.nome ?? "Sem classificação"}
                  </h2>

                  {!loadingUsuario && usuario?.patente && (
                    <>
                      <div className="mt-3 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="h-1.5 w-1.5 rounded-full bg-amber-300" />

                          <span className="text-xs font-semibold text-amber-200">
                            {usuario.pontuacao.toLocaleString("pt-BR")} pontos
                          </span>
                        </div>

                        {usuario.proximaPatente ? (
                          <span className="text-[10px] font-semibold text-white/30">
                            {usuario.proximaPatente.pontos.toLocaleString(
                              "pt-BR"
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
                          className="h-full rounded-full bg-amber-300 transition-all duration-700"
                          style={{
                            width: `${usuario.progresso}%`,
                          }}
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
