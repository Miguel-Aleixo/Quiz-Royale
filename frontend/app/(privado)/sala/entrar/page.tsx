"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Cookies from "js-cookie";
import { io, Socket } from "socket.io-client";
import {
  ArrowLeft,
  Check,
  Copy,
  Crown,
  Gamepad2,
  Loader2,
  LogOut,
  Play,
  Users,
  Wifi,
  WifiOff,
} from "lucide-react";
import { toast } from "sonner";

import { useToken } from "@/app/hooks/usuario/useToken";

interface Usuario {
  id: number;
  nome: string;
  email?: string;
  pontuacao?: number;
}

interface Jogador {
  id: number;
  usuarioId: number;
  salaId: number;
  eliminado: boolean;
  usuario: Usuario;
}

interface Criador {
  id: number;
  nome: string;
}

interface Sala {
  id: number;
  nome: string;
  codigo: string;
  status: string;
  maxJogadores: number;
  criador?: Criador | null;
  jogadores: Jogador[];
}

interface SalaAtualizada {
  id: number;
  nome: string;
  codigo: string;
  status: string;
  maxJogadores: number;
  criador?: Criador | null;
  jogadores: Jogador[];
}

interface ErroSocket {
  mensagem: string;
}

interface SalaFechada {
  codigo: string;
  mensagem: string;
}

function SalaEntrarContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const codigoParam = searchParams.get("codigo");
  const API = process.env.NEXT_PUBLIC_API;

  const usuario = useToken();

  const [sala, setSala] = useState<Sala | null>(null);

  const [carregando, setCarregando] =
    useState(true);

  const [erro, setErro] =
    useState("");

  const [conectado, setConectado] =
    useState(false);

  const [copiado, setCopiado] =
    useState(false);

  const [saindo, setSaindo] =
    useState(false);

  const [iniciando, setIniciando] =
    useState(false);

  const [modalSair, setModalSair] =
    useState(false);

  /*
   * =========================================================
   * BUSCAR SALA
   * =========================================================
   */

  useEffect(() => {
    async function buscarSala() {
      if (!codigoParam) {
        setErro(
          "Código da sala não informado."
        );

        setCarregando(false);

        return;
      }

      const token = Cookies.get("token");

      if (!token) {
        router.push("/login");
        return;
      }

      if (!API) {
        setErro(
          "API não configurada."
        );

        setCarregando(false);

        return;
      }

      try {
        setCarregando(true);
        setErro("");

        const res = await fetch(
          `${API}/sala/codigo/${codigoParam}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data = await res.json();

        if (!res.ok) {
          const mensagem = Array.isArray(
            data?.message
          )
            ? data.message.join(", ")
            : data?.message ||
              "Erro ao buscar sala.";

          throw new Error(mensagem);
        }

        setSala(data);
      } catch (error) {
        const mensagem =
          error instanceof Error
            ? error.message
            : "Erro ao carregar a sala.";

        setErro(mensagem);

        toast.error(mensagem);
      } finally {
        setCarregando(false);
      }
    }

    buscarSala();
  }, [
    API,
    codigoParam,
    router,
  ]);

  /*
   * =========================================================
   * SOCKET.IO
   * =========================================================
   */

  useEffect(() => {
    if (!codigoParam || !API) {
      return;
    }

    const token = Cookies.get("token");

    if (!token) {
      router.push("/login");
      return;
    }

    const socketInstance: Socket = io(API, {
      auth: {
        token,
      },
    });

    /*
     * CONECTADO
     */

    socketInstance.on(
      "connect",
      () => {
        console.log(
          "Conectado ao SalaGateway:",
          socketInstance.id
        );

        setConectado(true);

        socketInstance.emit(
          "entrar_sala",
          {
            codigo: codigoParam,
          }
        );
      }
    );

    /*
     * SALA ATUALIZADA
     */

    socketInstance.on(
      "sala_atualizada",
      (data: SalaAtualizada) => {
        console.log(
          "Sala atualizada:",
          data
        );

        setSala(data);
      }
    );

    /*
     * SALA FECHADA
     */

    socketInstance.on(
      "sala_fechada",
      (data: SalaFechada) => {
        console.log(
          "Sala fechada:",
          data.codigo
        );

        setConectado(false);

        toast.info(
          data.mensagem ||
            "O criador saiu. A sala foi fechada."
        );

        setTimeout(() => {
          router.push("/");
        }, 800);
      }
    );

    /*
     * PARTIDA INICIADA
     */

    socketInstance.on(
      "partida_iniciada",
      (data: { codigo: string }) => {
        console.log(
          "Partida iniciada:",
          data.codigo
        );

        toast.success(
          "A partida começou!"
        );

        setTimeout(() => {
          router.push(
            `/sala/partida?codigo=${data.codigo}`
          );
        }, 500);
      }
    );

    /*
     * ERRO DA SALA
     */

    socketInstance.on(
      "erro_sala",
      (data: ErroSocket) => {
        console.error(
          "Erro da sala:",
          data.mensagem
        );

        setErro(data.mensagem);

        toast.error(
          data.mensagem
        );
      }
    );

    /*
     * ERRO DE CONEXÃO
     */

    socketInstance.on(
      "connect_error",
      (error) => {
        console.error(
          "Erro ao conectar Socket.IO:",
          error.message
        );

        setConectado(false);

        toast.error(
          "Não foi possível conectar ao servidor em tempo real."
        );
      }
    );

    /*
     * DESCONECTADO
     */

    socketInstance.on(
      "disconnect",
      (reason) => {
        console.log(
          "Desconectado:",
          reason
        );

        setConectado(false);
      }
    );

    /*
     * LIMPEZA
     */

    return () => {
      socketInstance.disconnect();
    };
  }, [
    API,
    codigoParam,
    router,
  ]);

  /*
   * =========================================================
   * COPIAR CÓDIGO
   * =========================================================
   */

  async function copiarCodigo() {
    if (!sala?.codigo) {
      return;
    }

    try {
      await navigator.clipboard.writeText(
        sala.codigo
      );

      setCopiado(true);

      toast.success(
        "Código copiado!"
      );

      setTimeout(() => {
        setCopiado(false);
      }, 2000);
    } catch {
      toast.error(
        "Não foi possível copiar o código."
      );
    }
  }

  /*
   * =========================================================
   * SAIR DA SALA
   * =========================================================
   */

  async function sairDaSala() {
    if (!sala) {
      return;
    }

    const token = Cookies.get("token");

    if (!token) {
      router.push("/login");
      return;
    }

    if (!API) {
      toast.error(
        "API não configurada."
      );

      return;
    }

    try {
      setSaindo(true);
      setErro("");

      const res = await fetch(
        `${API}/sala/sair/${encodeURIComponent(
          sala.codigo
        )}`,
        {
          method: "DELETE",

          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await res.json();

      if (!res.ok) {
        const mensagem = Array.isArray(
          data?.message
        )
          ? data.message.join(", ")
          : data?.message ||
            "Não foi possível sair da sala.";

        throw new Error(mensagem);
      }

      toast.success(
        "Você saiu da sala."
      );

      setModalSair(false);

      router.push("/");
    } catch (error) {
      const mensagem =
        error instanceof Error
          ? error.message
          : "Erro ao sair da sala.";

      setErro(mensagem);

      toast.error(mensagem);
    } finally {
      setSaindo(false);
    }
  }

  /*
   * =========================================================
   * INICIAR PARTIDA
   * =========================================================
   */

  async function iniciarPartida() {
    if (!sala?.codigo) {
      return;
    }

    const token = Cookies.get("token");

    if (!token) {
      router.push("/login");
      return;
    }

    if (!API) {
      toast.error(
        "API não configurada."
      );

      return;
    }

    try {
      setIniciando(true);
      setErro("");

      const res = await fetch(
        `${API}/partida/iniciar/${sala.codigo}`,
        {
          method: "POST",

          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await res.json();

      if (!res.ok) {
        const mensagem = Array.isArray(
          data?.message
        )
          ? data.message.join(", ")
          : data?.message ||
            "Não foi possível iniciar a partida.";

        throw new Error(mensagem);
      }

      console.log(
        "Partida iniciada:",
        data
      );

      toast.success(
        "Partida iniciada!"
      );

      /*
       * O redirect acontece através
       * do evento partida_iniciada.
       */
    } catch (error) {
      const mensagem =
        error instanceof Error
          ? error.message
          : "Erro ao iniciar partida.";

      setErro(mensagem);

      toast.error(mensagem);

      setIniciando(false);
    }
  }

  /*
   * =========================================================
   * LOADING
   * =========================================================
   */

  if (carregando) {
    return (
      <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#080611] text-white">
        <div className="absolute -left-40 -top-40 h-96 w-96 rounded-full bg-purple-600/20 blur-3xl" />

        <div className="absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-indigo-600/20 blur-3xl" />

        <div className="relative flex flex-col items-center gap-5">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-purple-400/20 bg-purple-500/10 shadow-lg shadow-purple-950/30">
            <Loader2 className="h-8 w-8 animate-spin text-purple-400" />
          </div>

          <div className="text-center">
            <p className="font-bold">
              Entrando na sala...
            </p>

            <p className="mt-1 text-sm text-white/40">
              Aguarde um momento
            </p>
          </div>
        </div>
      </main>
    );
  }

  /*
   * =========================================================
   * ERRO SEM SALA
   * =========================================================
   */

  if (erro && !sala) {
    return (
      <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#080611] px-6 text-white">
        <div className="absolute left-1/2 top-0 h-96 w-96 -translate-x-1/2 rounded-full bg-red-600/10 blur-3xl" />

        <div className="relative w-full max-w-md rounded-[2rem] border border-red-400/15 bg-white/[0.035] p-8 text-center shadow-2xl backdrop-blur-xl">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-red-500/10">
            <WifiOff className="h-8 w-8 text-red-400" />
          </div>

          <h1 className="mt-6 text-xl font-black">
            Não foi possível entrar
          </h1>

          <p className="mt-3 text-sm leading-6 text-white/45">
            {erro}
          </p>

          <button
            type="button"
            onClick={() => router.back()}
            className="mt-7 flex w-full items-center justify-center gap-2 rounded-2xl bg-white/10 px-5 py-3.5 text-sm font-bold transition hover:bg-white/15"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </button>
        </div>
      </main>
    );
  }

  if (!sala) {
    return null;
  }

  /*
   * =========================================================
   * INFORMAÇÕES
   * =========================================================
   */

  const ehCriador =
    Number(usuario?.sub) ===
    Number(sala.criador?.id);

  const quantidadeJogadores =
    sala.jogadores?.length ?? 0;

  const percentualSala =
    sala.maxJogadores > 0
      ? Math.min(
          (quantidadeJogadores /
            sala.maxJogadores) *
            100,
          100
        )
      : 0;

  /*
   * =========================================================
   * TELA
   * =========================================================
   */

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#080611] text-white">

      {/* BACKGROUND */}

      <div className="pointer-events-none absolute -left-40 -top-40 h-[500px] w-[500px] rounded-full bg-purple-600/10 blur-3xl" />

      <div className="pointer-events-none absolute -bottom-60 -right-40 h-[500px] w-[500px] rounded-full bg-indigo-600/10 blur-3xl" />

      <div className="relative mx-auto min-h-screen w-full max-w-6xl px-5 py-6 md:px-8 md:py-10">

        {/* HEADER */}

        <header className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-purple-400/20 bg-purple-500/10 shadow-lg shadow-purple-950/20">
              <Gamepad2 className="h-5 w-5 text-purple-400" />
            </div>

            <div>
              <h1 className="text-sm font-black">
                QUIZ ROYALE
              </h1>

              <p className="text-[11px] font-medium text-white/35">
                Lobby da partida
              </p>
            </div>
          </div>

          {/* CONEXÃO */}

          <div
            className={`flex items-center gap-2 rounded-full border px-3 py-2 ${
              conectado
                ? "border-emerald-400/15 bg-emerald-500/10 text-emerald-300"
                : "border-yellow-400/15 bg-yellow-500/10 text-yellow-300"
            }`}
          >
            <span
              className={`h-2 w-2 rounded-full ${
                conectado
                  ? "bg-emerald-400"
                  : "animate-pulse bg-yellow-400"
              }`}
            />

            <span className="hidden text-[11px] font-bold sm:block">
              {conectado
                ? "Conectado"
                : "Conectando..."}
            </span>
          </div>
        </header>

        {/* ERRO */}

        {erro && sala && (
          <div className="mt-5 rounded-2xl border border-red-400/15 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {erro}
          </div>
        )}

        {/* CONTEÚDO */}

        <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_360px]">

          {/* CARD PRINCIPAL */}

          <section className="rounded-[2rem] border border-white/10 bg-white/[0.035] p-6 shadow-2xl shadow-black/20 backdrop-blur-xl md:p-8">

            {/* TOPO */}

            <div className="flex flex-col items-center text-center">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-purple-400/15 bg-purple-500/10 px-3 py-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-purple-400" />

                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-purple-300">
                  Sala aberta
                </span>
              </div>

              <h2 className="text-3xl font-black tracking-tight md:text-4xl">
                {sala.nome}
              </h2>

              <p className="mt-2 text-sm text-white/35">
                Compartilhe o código para seus amigos entrarem
              </p>
            </div>

            {/* CÓDIGO */}

            <div className="mx-auto mt-8 max-w-lg">
              <p className="mb-2 text-center text-[10px] font-black uppercase tracking-[0.2em] text-white/30">
                Código da sala
              </p>

              <button
                type="button"
                onClick={copiarCodigo}
                className="group relative flex w-full items-center justify-center overflow-hidden rounded-2xl border border-purple-400/20 bg-gradient-to-r from-purple-500/10 via-purple-500/5 to-indigo-500/10 px-5 py-5 transition hover:border-purple-400/40 hover:bg-purple-500/10"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.03] to-transparent opacity-0 transition group-hover:opacity-100" />

                <span className="relative font-mono text-3xl font-black tracking-[0.3em] text-purple-200 sm:text-4xl">
                  {sala.codigo}
                </span>

                <div className="absolute right-4 flex h-9 w-9 items-center justify-center rounded-xl bg-white/5">
                  {copiado ? (
                    <Check className="h-4 w-4 text-emerald-400" />
                  ) : (
                    <Copy className="h-4 w-4 text-white/35 transition group-hover:text-purple-300" />
                  )}
                </div>
              </button>

              <p className="mt-2 text-center text-[11px] text-white/25">
                Clique no código para copiar
              </p>
            </div>

            {/* STATUS DOS JOGADORES */}

            <div className="mt-9 rounded-2xl border border-white/10 bg-black/10 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/10">
                    <Users className="h-5 w-5 text-purple-400" />
                  </div>

                  <div>
                    <p className="text-sm font-black">
                      Jogadores
                    </p>

                    <p className="text-[11px] text-white/30">
                      Aguardando participantes
                    </p>
                  </div>
                </div>

                <span className="text-lg font-black text-white">
                  {quantidadeJogadores}

                  <span className="text-sm text-white/25">
                    /{sala.maxJogadores}
                  </span>
                </span>
              </div>

              {/* PROGRESSO */}

              <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/5">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-purple-500 to-indigo-400 transition-all duration-500"
                  style={{
                    width: `${percentualSala}%`,
                  }}
                />
              </div>
            </div>

            {/* JOGADORES */}

            <div className="mt-6">
              {quantidadeJogadores > 0 ? (
                <div className="grid gap-2 sm:grid-cols-2">
                  {sala.jogadores.map(
                    (jogador) => {
                      const ehJogadorCriador =
                        jogador.usuarioId ===
                        sala.criador?.id;

                      return (
                        <div
                          key={jogador.id}
                          className="group flex items-center gap-3 rounded-2xl border border-white/8 bg-white/[0.025] px-4 py-3 transition hover:border-purple-400/15 hover:bg-white/[0.04]"
                        >
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500/20 to-indigo-500/10 text-sm font-black text-purple-300">
                            {jogador.usuario.nome
                              .charAt(0)
                              .toUpperCase()}
                          </div>

                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-bold">
                              {jogador.usuario.nome}
                            </p>

                            {ehJogadorCriador ? (
                              <div className="mt-0.5 flex items-center gap-1 text-[9px] font-black uppercase tracking-wider text-yellow-300">
                                <Crown className="h-3 w-3" />
                                Criador
                              </div>
                            ) : (
                              <p className="mt-0.5 text-[10px] text-white/25">
                                Jogador
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    }
                  )}
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-white/10 px-5 py-8 text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-white/5">
                    <Users className="h-5 w-5 text-white/20" />
                  </div>

                  <p className="mt-3 text-sm font-bold text-white/50">
                    Aguardando jogadores
                  </p>

                  <p className="mt-1 text-xs text-white/25">
                    Compartilhe o código da sala
                  </p>
                </div>
              )}
            </div>
          </section>

          {/* SIDEBAR */}

          <aside className="flex flex-col gap-4">

            {/* STATUS */}

            <div className="rounded-[2rem] border border-white/10 bg-white/[0.035] p-5 shadow-xl backdrop-blur-xl">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-500/10">
                  <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-emerald-400" />
                </div>

                <div>
                  <p className="text-xs font-black uppercase tracking-wider text-white/35">
                    Status
                  </p>

                  <p className="mt-1 text-sm font-black text-emerald-400">
                    Aguardando início
                  </p>
                </div>
              </div>

              <div className="mt-5 border-t border-white/5 pt-5">
                <p className="text-xs leading-5 text-white/35">
                  {ehCriador
                    ? "Você é o criador desta sala. Quando estiver pronto, inicie a partida."
                    : "Aguarde o criador iniciar a partida."}
                </p>
              </div>
            </div>

            {/* CRIADOR */}

            <div className="rounded-[2rem] border border-yellow-400/10 bg-yellow-500/[0.035] p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-yellow-500/10">
                  <Crown className="h-5 w-5 text-yellow-300" />
                </div>

                <div className="min-w-0">
                  <p className="text-[10px] font-black uppercase tracking-wider text-yellow-300/50">
                    Criador
                  </p>

                  <p className="truncate text-sm font-bold">
                    {sala.criador?.nome ||
                      "Desconhecido"}
                  </p>
                </div>
              </div>
            </div>

            {/* INICIAR */}

            {ehCriador && (
              <button
                type="button"
                onClick={iniciarPartida}
                disabled={
                  iniciando ||
                  quantidadeJogadores === 0
                }
                className="group flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 px-5 py-4 text-sm font-black shadow-lg shadow-purple-950/30 transition hover:-translate-y-0.5 hover:from-purple-500 hover:to-indigo-500 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0"
              >
                {iniciando ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Iniciando...
                  </>
                ) : (
                  <>
                    <Play className="h-5 w-5 transition group-hover:scale-110" />
                    Iniciar partida
                  </>
                )}
              </button>
            )}

            {/* AVISO */}

            <div className="rounded-2xl border border-white/8 bg-white/[0.02] px-4 py-3">
              <p className="text-center text-[11px] leading-5 text-white/30">
                A partida começará para todos os jogadores
                simultaneamente.
              </p>
            </div>

            {/* SAIR */}

            <button
              type="button"
              onClick={() => setModalSair(true)}
              disabled={saindo}
              className="flex w-full items-center justify-center gap-2 rounded-2xl border border-white/8 bg-white/[0.02] px-5 py-3.5 text-xs font-bold text-white/40 transition hover:border-red-400/15 hover:bg-red-500/5 hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <LogOut className="h-4 w-4" />

              Sair da sala
            </button>
          </aside>
        </div>

        {/* RODAPÉ */}

        <div className="mt-6 text-center">
          <p className="text-[10px] font-medium text-white/20">
            Quiz Royale • Sala de espera
          </p>
        </div>
      </div>

      {/* =====================================================
          MODAL SAIR DA SALA
          ===================================================== */}

      {modalSair && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-5 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setModalSair(false);
            }
          }}
        >
          <div
            className="w-full max-w-md overflow-hidden rounded-[2rem] border border-white/10 bg-[#11101c] shadow-2xl shadow-black/50"
            onMouseDown={(event) => {
              event.stopPropagation();
            }}
          >

            {/* CABEÇALHO */}

            <div className="border-b border-white/5 px-6 py-5">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-red-500/10">
                  <LogOut className="h-5 w-5 text-red-400" />
                </div>

                <div>
                  <h2 className="text-base font-black">
                    Sair da sala?
                  </h2>

                  <p className="mt-0.5 text-xs text-white/35">
                    Essa ação precisa de confirmação
                  </p>
                </div>
              </div>
            </div>

            {/* CONTEÚDO */}

            <div className="px-6 py-6">

              {/* ALERTA */}

              <div className="rounded-2xl border border-red-400/10 bg-red-500/5 p-4">
                <div className="flex gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-500/10">
                    <span className="text-sm font-black text-red-400">
                      !
                    </span>
                  </div>

                  <div>
                    <p className="text-sm font-bold text-red-300">
                      Atenção
                    </p>

                    <p className="mt-1 text-xs leading-5 text-white/45">
                      Ao sair da sala, ela será
                      fechada para todos os
                      jogadores que estão
                      aguardando.
                    </p>
                  </div>
                </div>
              </div>

              {/* PERGUNTA */}

              <p className="mt-5 text-sm leading-6 text-white/50">
                Tem certeza que deseja sair da sala{" "}
                <span className="font-bold text-white">
                  {sala.nome}
                </span>
                ?
              </p>
            </div>

            {/* BOTÕES */}

            <div className="flex gap-3 border-t border-white/5 px-6 py-5">

              <button
                type="button"
                onClick={() =>
                  setModalSair(false)
                }
                disabled={saindo}
                className="flex-1 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm font-bold text-white/60 transition hover:bg-white/[0.06] hover:text-white disabled:opacity-40"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={sairDaSala}
                disabled={saindo}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-3 text-sm font-black text-white transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saindo ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saindo...
                  </>
                ) : (
                  <>
                    <LogOut className="h-4 w-4" />
                    Sair da sala
                  </>
                )}
              </button>

            </div>
          </div>
        </div>
      )}
    </main>
  );
}

/*
 * ===========================================================
 * PAGE
 * ===========================================================
 */

export default function Page() {
  return (
    <Suspense
      fallback={
        <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#080611] text-white">
          <div className="flex flex-col items-center gap-5">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-purple-400/20 bg-purple-500/10">
              <Loader2 className="h-8 w-8 animate-spin text-purple-400" />
            </div>

            <p className="text-sm font-bold text-white/50">
              Carregando sala...
            </p>
          </div>
        </main>
      }
    >
      <SalaEntrarContent />
    </Suspense>
  );
}