"use client";

import {
  ArrowRight,
  Gamepad2,
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

export default function Home() {
  const router = useRouter();
  const API = process.env.NEXT_PUBLIC_API;

  const [busca, setBusca] = useState("");
  const [filtroSalas, setFiltroSalas] = useState<"TODAS" | "DISPONIVEIS" | "MINHAS">("TODAS");

  const [token, setToken] = useState<string | undefined>(
    undefined
  );
  const [mounted, setMounted] = useState(false);

  const [loading, setLoading] = useState(false);

  const [usuario, setUsuario] = useState<Usuario | null>(
    null
  );
  const [salas, setSalas] = useState<Sala[]>([]);
  const [perguntas, setPerguntas] = useState<Pergunta[]>([]);
  const [codigo, setCodigo] = useState("");

  const [loadingUsuario, setLoadingUsuario] = useState(false);
  const [loadingSalas, setLoadingSalas] = useState(false);
  const [loadingPerguntas, setLoadingPerguntas] =
    useState(false);

  /*
   * ESTADO DE LOGIN
   */
  const estaLogado = mounted && Boolean(token);

  /*
   * ESTADO DE VERIFICAÇÃO
   */
  const emailNaoVerificado =
    estaLogado &&
    usuario !== null &&
    !usuario.emailVerificado;

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
        `/verificar-email?email=${encodeURIComponent(
          usuario.email
        )}`
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

      const payload = JSON.parse(
        atob(partes[1])
      );

      const id = payload.sub;

      if (!id) {
        throw new Error(
          "Usuário não encontrado no token."
        );
      }

      const res = await fetch(
        `${API}/usuario/${id}`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${currentToken}`,
          },
          cache: "no-store",
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          Array.isArray(data.message)
            ? data.message.join(", ")
            : data.message ||
            "Erro ao buscar usuário."
        );
      }

      setUsuario(data);
    } catch (error) {
      console.error(
        "Erro ao buscar usuário:",
        error
      );

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

      const res = await fetch(
        `${API}/sala`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${currentToken}`,
          },
          cache: "no-store",
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          Array.isArray(data.message)
            ? data.message.join(", ")
            : data.message ||
            "Erro ao buscar salas."
        );
      }

      setSalas(data);
    } catch (error) {
      console.error(
        "Erro ao buscar salas:",
        error
      );

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
  async function buscarPerguntas(
    currentToken: string
  ) {
    try {
      setLoadingPerguntas(true);

      const res = await fetch(
        `${API}/pergunta`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${currentToken}`,
          },
          cache: "no-store",
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          Array.isArray(data.message)
            ? data.message.join(", ")
            : data.message ||
            "Erro ao buscar perguntas."
        );
      }

      setPerguntas(data);
    } catch (error) {
      console.error(
        "Erro ao buscar perguntas:",
        error
      );

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
    const currentToken =
      Cookies.get("token");

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
   * LISTAGEM UNIFICADA DE SALAS
   * Todas: salas abertas + todas as salas criadas pelo usuário, sem duplicação.
   * Disponíveis: salas abertas.
   * Minhas salas: salas criadas pelo usuário autenticado.
   */
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
    const minhasIds = new Set(minhasSalas.map((sala) => sala.id));

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
  }, [salas, salasAbertas, minhasSalas, busca, filtroSalas]);

  const totalSalasUnicas = useMemo(() => {
    const unicas = new Map<number, Sala>();
    salasAbertas.forEach((sala) => unicas.set(sala.id, sala));
    minhasSalas.forEach((sala) => unicas.set(sala.id, sala));
    return unicas.size;
  }, [salasAbertas, minhasSalas]);

  /*
   * TOTAL DE JOGADORES
   */
  const jogadoresNasSalas = useMemo(
    () =>
      salas.reduce(
        (total, sala) =>
          total +
          (sala._count?.jogadores ?? 0),
        0
      ),
    [salas]
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

      const currentToken =
        Cookies.get("token");

      if (!currentToken) {
        router.push("/login");
        return;
      }

      const codigoFormatado =
        codigo.trim().toUpperCase();

      if (!codigoFormatado) {
        toast.warning(
          "Digite o código da sala."
        );
        return;
      }

      const res = await fetch(
        `${API}/sala/entrar`,
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
            Authorization: `Bearer ${currentToken}`,
          },
          body: JSON.stringify({
            codigo: codigoFormatado,
          }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          Array.isArray(data.message)
            ? data.message.join(", ")
            : data.message ||
            "Erro ao entrar na sala."
        );
      }

      toast.success(
        "Você entrou na sala!"
      );

      router.push(
        `/sala/entrar?codigo=${codigoFormatado}`
      );
    } catch (error) {
      console.error(
        "Erro ao entrar na sala:",
        error
      );

      toast.error(
        error instanceof Error
          ? error.message
          : "Não foi possível entrar na sala."
      );
    } finally {
      setLoading(false);
    }
  }

  /*
   * ENTRAR DIRETO NA SALA
   */
  async function entrarDiretoNaSala(
    sala: Sala
  ) {
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

      const currentToken =
        Cookies.get("token");

      if (!currentToken) {
        router.push("/login");
        return;
      }

      const res = await fetch(
        `${API}/sala/entrar`,
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
            Authorization: `Bearer ${currentToken}`,
          },
          body: JSON.stringify({
            codigo: sala.codigo,
          }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          Array.isArray(data.message)
            ? data.message.join(", ")
            : data.message ||
            "Erro ao entrar na sala."
        );
      }

      toast.success(
        "Você entrou na sala!"
      );

      router.push(
        `/sala/entrar?codigo=${sala.codigo}`
      );
    } catch (error) {
      console.error(
        "Erro ao entrar na sala:",
        error
      );

      toast.error(
        error instanceof Error
          ? error.message
          : "Não foi possível entrar na sala."
      );
    } finally {
      setLoading(false);
    }
  }

  /*
   * REABRIR SALA
   */
  async function reabrirSala(
    salaId: number
  ) {
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

      const currentToken =
        Cookies.get("token");

      if (!currentToken) {
        router.push("/login");
        return;
      }

      const res = await fetch(
        `${API}/sala/${salaId}/reabrir`,
        {
          method: "PATCH",
          headers: {
            "Content-Type":
              "application/json",
            Authorization: `Bearer ${currentToken}`,
          },
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          Array.isArray(data.message)
            ? data.message.join(", ")
            : data.message ||
            "Não foi possível reabrir a sala."
        );
      }

      toast.success(
        "Sala reaberta! Um novo código foi gerado."
      );

      await buscarSalas(
        currentToken
      );
    } catch (error) {
      console.error(
        "Erro ao reabrir sala:",
        error
      );

      toast.error(
        error instanceof Error
          ? error.message
          : "Não foi possível reabrir a sala."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen overflow-hidden bg-[#090b18] text-white selection:bg-fuchsia-300/30">

      <LoadingOverlay
        show={
          loading ||
          loadingPerguntas ||
          loadingSalas ||
          loadingUsuario
        }
      />

      {/* BACKGROUND */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">

        <div className="absolute -left-48 -top-48 h-[34rem] w-[34rem] rounded-full bg-fuchsia-600/20 blur-[110px]" />

        <div className="absolute left-1/3 top-20 h-[24rem] w-[24rem] rounded-full bg-violet-600/12 blur-[120px]" />

        <div className="absolute -right-40 top-1/4 h-[30rem] w-[30rem] rounded-full bg-cyan-400/15 blur-[120px]" />

        <div className="absolute right-1/4 bottom-[-14rem] h-[30rem] w-[30rem] rounded-full bg-orange-400/10 blur-[120px]" />

        <div className="absolute bottom-[-18rem] left-1/3 h-[34rem] w-[34rem] rounded-full bg-indigo-500/12 blur-[120px]" />

        <div className="absolute inset-0 opacity-[0.035] [background-image:linear-gradient(rgba(255,255,255,.8)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.8)_1px,transparent_1px)] [background-size:48px_48px]" />

      </div>

      <Header
        nome={usuario?.nome}
        patente={usuario?.patente?.nome}
      />

      <section className="relative z-10 mx-auto max-w-7xl px-5 pb-12 pt-24 sm:px-8 lg:pt-28">

        {/* HERO */}
        <div className="mb-8 flex flex-col justify-between gap-6 lg:flex-row lg:items-end">

          <div className="max-w-2xl">

            <h1 className="text-4xl font-black leading-[1.04] tracking-[-0.045em] sm:text-6xl">
              Pronto para
              <span className="block bg-gradient-to-r from-fuchsia-200 via-orange-200 to-cyan-200 bg-clip-text text-transparent">
                dominar a arena?
              </span>
            </h1>

            <p className="mt-4 max-w-xl text-sm leading-7 text-white/45 sm:text-base">
              Entre em uma batalha, desafie seus amigos e suba no ranking
              respondendo perguntas em tempo recorde.
            </p>

          </div>

        </div>

        {/* CARDS PRINCIPAIS */}
        <div className="grid gap-4 lg:grid-cols-[1.08fr_.92fr]">

          {/* ENTRAR EM SALA */}
          <div className="group relative overflow-hidden rounded-[26px] border border-violet-300/25 bg-[#171936] p-5 shadow-[0_18px_50px_rgba(49,46,129,0.24)] transition hover:-translate-y-1 hover:border-violet-200/50 sm:p-7">

            <div className="absolute -right-20 -top-20 h-56 w-56 rounded-full bg-violet-500/15 blur-[80px] transition duration-500 group-hover:bg-violet-400/30" />

            <div className="relative">

              <div className="flex items-start justify-between">

                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-400/20 text-violet-200 ring-1 ring-inset ring-violet-300/15 shadow-lg shadow-violet-950/20">
                  <Gamepad2 size={23} />
                </div>

              </div>

              <h2 className="mt-6 text-2xl font-black tracking-tight">
                Entrar em uma sala
              </h2>

              <p className="mt-2 max-w-sm text-sm leading-6 text-white/45">
                Use o código compartilhado pelo criador da partida.
              </p>

              <div className="mt-6 flex gap-3">

                <input
                  value={codigo}
                  onChange={(e) =>
                    setCodigo(
                      e.target.value.toUpperCase()
                    )
                  }
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      entrarNaSala();
                    }
                  }}
                  placeholder="CÓDIGO DA SALA"
                  maxLength={6}
                  aria-label="Código da sala"
                  className="h-13 min-w-0 flex-1 rounded-xl border border-violet-100/10 bg-[#0c1022] px-4 text-sm font-bold tracking-[0.18em] text-white outline-none transition placeholder:text-white/20 focus:border-violet-300/70 focus:bg-[#11152b] focus:ring-4 focus:ring-violet-400/10"
                />

                <button
                  onClick={() => {
                    if (
                      !estaLogado ||
                      emailNaoVerificado
                    ) {
                      tratarAcesso();
                      return;
                    }

                    entrarNaSala();
                  }}
                  disabled={
                    (!estaLogado ||
                      emailNaoVerificado)
                      ? false
                      : !codigo.trim() ||
                      loading
                  }
                  aria-label={
                    !estaLogado
                      ? "Entrar"
                      : emailNaoVerificado
                        ? "Verificar e-mail"
                        : "Entrar na sala"
                  }
                  className={`flex h-13 w-13 shrink-0 cursor-pointer items-center justify-center rounded-2xl transition hover:-translate-y-0.5 hover:shadow-lg disabled:cursor-not-allowed ${!estaLogado
                      ? "bg-white/10 text-white/60 hover:bg-white/15"
                      : emailNaoVerificado
                        ? "bg-amber-400/10 text-amber-300 hover:bg-amber-400/20"
                        : "bg-fuchsia-300 text-[#171022] hover:bg-fuchsia-200 hover:shadow-fuchsia-500/20 disabled:opacity-30"
                    }`}
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

          {/* CRIAR SALA */}
          <button
            onClick={() => {
              if (!estaLogado) {
                setLoading(true);
                router.push("/login");
                return;
              }

              if (
                emailNaoVerificado &&
                usuario
              ) {
                setLoading(true);

                router.push(
                  `/verificar-email?email=${encodeURIComponent(
                    usuario.email
                  )}`
                );

                return;
              }

              setLoading(true);
              router.push("/sala/criar");
            }}
            className="group relative cursor-pointer overflow-hidden rounded-[26px] border border-orange-300/25 bg-[#24182a] p-5 text-left shadow-[0_18px_50px_rgba(154,52,18,0.18)] transition duration-300 hover:-translate-y-1 hover:border-orange-200/50 sm:p-7"
          >

            <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-orange-400/15 blur-[80px] transition group-hover:bg-fuchsia-400/25" />

            <div className="relative flex h-full flex-col">

              <div className="flex items-start justify-between">

                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-300/15 text-orange-100 ring-1 ring-inset ring-orange-200/15">
                  <Plus size={23} />
                </div>

                <ArrowRight
                  size={21}
                  className="text-white/30 transition group-hover:translate-x-1 group-hover:text-sky-100"
                />

              </div>

              <h2 className="mt-6 text-2xl font-black tracking-tight">
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
          </button>

        </div>

        {/* SALAS — LISTAGEM UNIFICADA */}
        <section className="relative mt-5 overflow-hidden rounded-[26px] border border-white/10 bg-[#11152a]/90 p-5 shadow-[0_18px_55px_rgba(30,41,100,0.18)] sm:p-6">
          <div className="pointer-events-none absolute -right-20 -top-24 h-52 w-52 rounded-full bg-violet-500/10 blur-[80px]" />

          <div className="relative mb-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-400/15 text-violet-100">
                  <Swords size={18} />
                </div>
                <h2 className="text-xl font-black tracking-tight">Salas</h2>
                <span className="rounded-lg bg-white/[0.06] px-2 py-1 text-xs font-bold text-white/60">
                  {estaLogado ? totalSalasUnicas : "—"}
                </span>
              </div>
              <p className="mt-2 text-sm text-white/40">
                Encontre uma partida ou gerencie suas próprias batalhas.
              </p>
            </div>

            <div className="flex w-full flex-col gap-3 sm:flex-row lg:w-auto">
              <div className="relative min-w-0 flex-1 sm:w-64 sm:flex-none">
                <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" />
                <input
                  value={busca}
                  onChange={(event) => setBusca(event.target.value)}
                  placeholder="Buscar nome, código ou ID..."
                  aria-label="Buscar salas por nome, código ou identificador"
                  className="h-10 w-full rounded-xl border border-white/10 bg-[#0d1122] pl-10 pr-10 text-sm font-medium text-white outline-none placeholder:text-white/25 transition focus:border-violet-300/50 focus:ring-4 focus:ring-violet-400/[0.08]"
                />
                {busca && (
                  <button
                    type="button"
                    onClick={() => setBusca("")}
                    aria-label="Limpar pesquisa"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-bold text-white/40 transition hover:text-white"
                  >
                    ×
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="relative mb-5 flex flex-wrap items-center gap-2 border-b border-white/[0.07] pb-4">
            {([
              { id: "TODAS", label: "Todas", count: totalSalasUnicas },
              { id: "DISPONIVEIS", label: "Disponíveis", count: salasAbertas.length },
              ...(estaLogado ? [{ id: "MINHAS", label: "Minhas salas", count: minhasSalas.length }] : []),
            ] as { id: "TODAS" | "DISPONIVEIS" | "MINHAS"; label: string; count: number }[]).map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setFiltroSalas(item.id)}
                className={`inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-bold transition ${filtroSalas === item.id ? "bg-violet-300/15 text-violet-100 ring-1 ring-inset ring-violet-300/25" : "text-white/45 hover:bg-white/[0.05] hover:text-white/80"}`}
              >
                {item.label}
                <span className={`text-xs ${filtroSalas === item.id ? "text-violet-200" : "text-white/30"}`}>{item.count}</span>
              </button>
            ))}
          </div>

          {!estaLogado ? (
            <div className="relative flex min-h-32 flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 bg-white/[0.015] px-5 py-7 text-center">
              <p className="text-sm font-semibold text-white/65">Entre para visualizar as salas.</p>
              <p className="mt-1 text-xs text-white/35">Faça login para encontrar partidas e gerenciar suas salas.</p>
              <button onClick={tratarAcesso} className="mt-4 rounded-xl bg-violet-300/15 px-4 py-2 text-xs font-bold text-violet-100 transition hover:bg-violet-300/25">
                Entrar agora
              </button>
            </div>
          ) : loadingSalas ? (
            <div className="relative grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {[1, 2, 3].map((item) => <div key={item} className="h-32 animate-pulse rounded-2xl bg-white/[0.04]" />)}
            </div>
          ) : salasExibidas.length === 0 ? (
            <div className="relative flex min-h-32 flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 bg-white/[0.015] px-5 py-7 text-center">
              <p className="text-sm font-semibold text-white/65">
                {busca ? "Nenhuma sala corresponde à sua pesquisa." : filtroSalas === "MINHAS" ? "Você ainda não criou nenhuma sala." : filtroSalas === "DISPONIVEIS" ? "Nenhuma sala aberta no momento." : "Nenhuma sala para exibir no momento."}
              </p>
              <p className="mt-1 text-xs text-white/35">
                {busca ? "Tente outro nome, código ou identificador." : filtroSalas === "MINHAS" || filtroSalas === "TODAS" ? "Crie uma sala para começar sua próxima batalha." : "Volte em alguns instantes ou crie sua própria partida."}
              </p>
              {busca && (
                <button type="button" onClick={() => setBusca("")} className="mt-3 text-xs font-bold text-violet-200 hover:text-violet-100">Limpar pesquisa</button>
              )}
            </div>
          ) : (
            <div className="relative grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {salasExibidas.map((sala) => {
                const minhaSala = Boolean(usuario && Number(sala.criadorId) === Number(usuario.id));
                const encerrada = sala.status === "FINALIZADA" || sala.status === "ENCERRADA";
                const emAndamento = sala.status === "ANDAMENTO" || sala.status === "EM_ANDAMENTO";
                const disponivel = sala.status === "ABERTA";

                return (
                  <article key={sala.id} className="group relative flex min-w-0 flex-col overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0d1122]/75 p-4 transition duration-200 hover:border-violet-300/25 hover:bg-white/[0.035]">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${emAndamento ? "bg-amber-400/10 text-amber-200" : encerrada ? "bg-fuchsia-400/10 text-fuchsia-200" : "bg-emerald-400/10 text-emerald-200"}`}>
                          {emAndamento ? <Zap size={18} /> : <Swords size={18} />}
                        </div>
                        <div className="min-w-0">
                          <h3 className="truncate text-sm font-black text-white/90">{sala.nome}</h3>
                          <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.14em] text-white/30">Sala #{sala.id}</p>
                        </div>
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-1.5">
                        <span className={`rounded-md px-2 py-1 text-[9px] font-black uppercase tracking-wider ${emAndamento ? "bg-amber-400/10 text-amber-200" : encerrada ? "bg-fuchsia-400/10 text-fuchsia-200" : disponivel ? "bg-emerald-400/10 text-emerald-200" : "bg-white/[0.07] text-white/50"}`}>
                          {emAndamento ? "Em andamento" : encerrada ? "Finalizada" : disponivel ? "Aberta" : sala.status.replaceAll("_", " ")}
                        </span>
                        {minhaSala && <span className="rounded-md bg-violet-400/10 px-2 py-1 text-[9px] font-bold text-violet-200">Sua sala</span>}
                      </div>
                    </div>

                    <div className="mt-4 flex items-end justify-between border-t border-white/[0.06] pt-3">
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/30">Código</p>
                        <p className="mt-1 font-mono text-sm font-black tracking-[0.18em] text-violet-200">{sala.codigo}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/30">Jogadores</p>
                        <p className="mt-1 flex items-center justify-end gap-1 text-sm font-bold text-white/70"><Users size={13} />{sala._count?.jogadores ?? 0}/{sala.maxJogadores}</p>
                      </div>
                    </div>

                    {minhaSala ? (
                      encerrada ? (
                        <button type="button" onClick={() => reabrirSala(sala.id)} disabled={loading} className="mt-4 flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-violet-300/15 text-xs font-black text-violet-100 transition hover:bg-violet-300/25 disabled:cursor-not-allowed disabled:opacity-40">
                          <RefreshCw size={14} /> Abrir novamente
                        </button>
                      ) : (
                        <button type="button" onClick={() => {
                          if (emailNaoVerificado && usuario) {
                            setLoading(true);
                            router.push(`/verificar-email?email=${encodeURIComponent(usuario.email)}`);
                            return;
                          }
                          setCodigo(sala.codigo);
                        }} className="mt-4 flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-white/[0.05] text-xs font-black text-white/70 transition hover:bg-white/[0.09] hover:text-white">
                          {emailNaoVerificado ? <><Mail size={14} /> Verificar e-mail</> : <><ArrowRight size={14} /> {emAndamento ? "Continuar sala" : "Selecionar sala"}</>}
                        </button>
                      )
                    ) : disponivel ? (
                      <button type="button" onClick={() => {
                        if (!estaLogado || emailNaoVerificado) {
                          tratarAcesso();
                          return;
                        }
                        entrarDiretoNaSala(sala);
                      }} className="mt-4 flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-violet-300/10 text-xs font-black text-violet-100 transition hover:bg-violet-300/20">
                        Entrar na sala <ArrowRight size={14} />
                      </button>
                    ) : (
                      <div className="mt-4 flex h-10 items-center justify-center rounded-xl bg-white/[0.025] text-xs font-semibold text-white/30">
                        Sala indisponível para entrada
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </section>

        {/* PARTE INFERIOR */}
        <div className="mt-5 grid gap-4 ">

          {/* PATENTE */}
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
            className="group relative cursor-pointer overflow-hidden rounded-[26px] border border-amber-200/20 bg-[#282033] p-5 text-left shadow-[0_18px_50px_rgba(180,83,9,0.15)] transition hover:-translate-y-1 hover:border-amber-200/40 sm:p-6"
          >

            <div className="absolute -right-10 -top-10 h-36 w-36 rounded-full bg-amber-300/12 blur-[65px]" />

            <div className="relative">

              <div className="flex items-start justify-between">

                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-400/10 text-amber-200">
                  <Trophy size={21} />
                </div>

                <Shield
                  size={18}
                  className="text-amber-200/30"
                />

              </div>

              {!estaLogado ? (

                <>
                  <p className="mt-5 text-[10px] font-bold uppercase tracking-[0.2em] text-white/30">
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

                    <span>
                      Entrar agora
                    </span>

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
                      : usuario?.patente?.nome ??
                      "Sem classificação"}
                  </h2>

                  {!loadingUsuario &&
                    usuario?.patente && (
                      <>

                        <div className="mt-3 flex items-center justify-between">

                          <div className="flex items-center gap-2">

                            <span className="h-1.5 w-1.5 rounded-full bg-amber-300" />

                            <span className="text-xs font-semibold text-amber-200">
                              {usuario.pontuacao.toLocaleString(
                                "pt-BR"
                              )}{" "}
                              pontos
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

                            <span>
                              {usuario.patente.nome}
                            </span>

                            <span>
                              {usuario.proximaPatente.nome}
                            </span>

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
