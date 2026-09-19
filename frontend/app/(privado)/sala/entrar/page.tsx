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
          throw new Error(
            Array.isArray(data.message)
              ? data.message.join(", ")
              : data.message ||
                  "Erro ao buscar sala."
          );
        }

        setSala(data);
      } catch (error) {
        setErro(
          error instanceof Error
            ? error.message
            : "Erro ao carregar a sala."
        );
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

    console.log(
      "Tentando conectar ao SalaGateway..."
    );

    const socketInstance: Socket = io(API, {
      auth: {
        token,
      },
    });

    /*
     * =======================================================
     * CONECTADO
     * =======================================================
     */

    socketInstance.on(
      "connect",
      () => {
        console.log(
          "Conectado ao SalaGateway:",
          socketInstance.id
        );

        setConectado(true);

        /*
         * Entra na room da sala.
         */

        socketInstance.emit(
          "entrar_sala",
          {
            codigo: codigoParam,
          }
        );
      }
    );

    /*
     * =======================================================
     * SALA ATUALIZADA
     * =======================================================
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
     * =======================================================
     * PARTIDA INICIADA
     * =======================================================
     *
     * Esse evento é enviado pelo SalaGateway
     * quando o criador inicia a partida.
     *
     * Todos os jogadores que estão na sala
     * recebem esse evento.
     */

    socketInstance.on(
      "partida_iniciada",
      (data: { codigo: string }) => {
        console.log(
          "PARTIDA INICIADA:",
          data.codigo
        );

        router.push(
          `/partida?codigo=${data.codigo}`
        );
      }
    );

    /*
     * =======================================================
     * ERRO DA SALA
     * =======================================================
     */

    socketInstance.on(
      "erro_sala",
      (data: ErroSocket) => {
        console.error(
          "Erro da sala:",
          data.mensagem
        );

        setErro(data.mensagem);
      }
    );

    /*
     * =======================================================
     * ERRO DE CONEXÃO
     * =======================================================
     */

    socketInstance.on(
      "connect_error",
      (error) => {
        console.error(
          "Erro ao conectar Socket.IO:",
          error.message
        );

        setConectado(false);

        setErro(
          "Não foi possível conectar ao servidor em tempo real."
        );
      }
    );

    /*
     * =======================================================
     * DESCONECTADO
     * =======================================================
     */

    socketInstance.on(
      "disconnect",
      (reason) => {
        console.log(
          "Desconectado do SalaGateway:",
          reason
        );

        setConectado(false);
      }
    );

    /*
     * =======================================================
     * LIMPEZA
     * =======================================================
     */

    return () => {
      console.log(
        "Desconectando SalaGateway..."
      );

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

      setTimeout(() => {
        setCopiado(false);
      }, 2000);
    } catch {
      setErro(
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
      setErro(
        "API não configurada."
      );

      return;
    }

    try {
      setSaindo(true);
      setErro("");

      const res = await fetch(
        `${API}/sala/${sala.id}/sair`,
        {
          method: "DELETE",

          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          Array.isArray(data.message)
            ? data.message.join(", ")
            : data.message ||
                "Não foi possível sair da sala."
        );
      }

      router.push("/");
    } catch (error) {
      setErro(
        error instanceof Error
          ? error.message
          : "Erro ao sair da sala."
      );
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
      setErro(
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
        throw new Error(
          Array.isArray(data.message)
            ? data.message.join(", ")
            : data.message ||
                "Não foi possível iniciar a partida."
        );
      }

      console.log(
        "Partida iniciada pelo criador:",
        data
      );

      /*
       * Não precisamos fazer router.push aqui.
       *
       * O backend vai emitir:
       *
       * partida_iniciada
       *
       * para todos os jogadores da sala.
       *
       * Inclusive o criador.
       */

    } catch (error) {
      setErro(
        error instanceof Error
          ? error.message
          : "Erro ao iniciar partida."
      );

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
      <main className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-purple-400" />

          <p className="text-sm text-white/50">
            Entrando na sala...
          </p>
        </div>
      </main>
    );
  }

  /*
   * =========================================================
   * ERRO
   * =========================================================
   */

  if (erro && !sala) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 px-6 text-white">
        <div className="w-full max-w-md rounded-3xl border border-red-400/20 bg-red-500/10 p-8 text-center">
          <WifiOff className="mx-auto h-12 w-12 text-red-400" />

          <h1 className="mt-5 text-xl font-bold">
            Erro
          </h1>

          <p className="mt-3 text-sm text-white/50">
            {erro}
          </p>

          <button
            onClick={() =>
              router.back()
            }
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-white/10 px-5 py-3 text-sm font-bold transition hover:bg-white/15"
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
   * VERIFICAR CRIADOR
   * =========================================================
   */

  const ehCriador =
    Number(usuario?.sub) ===
    Number(sala.criador?.id);

  const quantidadeJogadores =
    sala.jogadores?.length ?? 0;

  const salaCheia =
    quantidadeJogadores >=
    sala.maxJogadores;

  /*
   * =========================================================
   * TELA
   * =========================================================
   */

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto flex min-h-screen w-full max-w-5xl flex-col px-5 py-8 md:px-8">

        {/* HEADER */}

        <header className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-purple-400/20 bg-purple-500/10">
              <Gamepad2 className="h-6 w-6 text-purple-400" />
            </div>

            <div>
              <h1 className="font-black">
                Quiz Royale
              </h1>

              <p className="text-xs text-white/40">
                Sala de espera
              </p>
            </div>
          </div>

          {/* CONEXÃO */}

          <div
            className={`flex items-center gap-2 rounded-xl border px-3 py-2 ${
              conectado
                ? "border-emerald-400/20 bg-emerald-500/10 text-emerald-300"
                : "border-yellow-400/20 bg-yellow-500/10 text-yellow-300"
            }`}
          >
            {conectado ? (
              <>
                <Wifi className="h-4 w-4" />

                <span className="text-xs font-bold">
                  Conectado
                </span>
              </>
            ) : (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />

                <span className="text-xs font-bold">
                  Conectando...
                </span>
              </>
            )}
          </div>
        </header>

        {/* ERRO DE SOCKET */}

        {erro && (
          <div className="mt-6 rounded-2xl border border-red-400/20 bg-red-500/10 px-5 py-4 text-sm text-red-300">
            {erro}
          </div>
        )}

        {/* SALA */}

        <section className="mt-8">
          <div className="rounded-[2rem] border border-white/10 bg-white/[0.035] p-6 shadow-2xl md:p-8">

            {/* NOME */}

            <div className="text-center">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-purple-400">
                Sala
              </p>

              <h2 className="mt-3 text-3xl font-black md:text-4xl">
                {sala.nome}
              </h2>
            </div>

            {/* CÓDIGO */}

            <div className="mx-auto mt-8 max-w-md">
              <p className="mb-2 text-center text-xs font-bold uppercase tracking-wider text-white/30">
                Código da sala
              </p>

              <button
                onClick={copiarCodigo}
                className="group flex w-full items-center justify-between rounded-2xl border border-purple-400/20 bg-purple-500/10 px-5 py-4 transition hover:border-purple-400/40 hover:bg-purple-500/15"
              >
                <span className="font-mono text-2xl font-black tracking-[0.25em] text-purple-300">
                  {sala.codigo}
                </span>

                {copiado ? (
                  <Check className="h-5 w-5 text-emerald-400" />
                ) : (
                  <Copy className="h-5 w-5 text-white/40 transition group-hover:text-purple-300" />
                )}
              </button>

              {copiado && (
                <p className="mt-2 text-center text-xs text-emerald-400">
                  Código copiado!
                </p>
              )}
            </div>

            {/* JOGADORES */}

            <div className="mt-10">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-purple-400" />

                  <h3 className="font-black">
                    Jogadores
                  </h3>
                </div>

                <span className="rounded-lg bg-white/5 px-3 py-1.5 text-xs font-bold text-white/60">
                  {quantidadeJogadores}/
                  {sala.maxJogadores}
                </span>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                {sala.jogadores.map(
                  (jogador) => {
                    const ehJogadorCriador =
                      jogador.usuarioId ===
                      sala.criador?.id;

                    return (
                      <div
                        key={jogador.id}
                        className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.025] px-4 py-4"
                      >
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-500/10 font-black text-purple-300">
                          {jogador.usuario.nome
                            .charAt(0)
                            .toUpperCase()}
                        </div>

                        <div className="min-w-0 flex-1">
                          <p className="truncate font-bold">
                            {jogador.usuario.nome}
                          </p>

                          {ehJogadorCriador && (
                            <div className="mt-1 flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-yellow-300">
                              <Crown className="h-3 w-3" />
                              Criador
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  }
                )}
              </div>

              {quantidadeJogadores ===
                0 && (
                <div className="rounded-2xl border border-dashed border-white/10 px-5 py-10 text-center">
                  <Users className="mx-auto h-8 w-8 text-white/20" />

                  <p className="mt-3 text-sm text-white/40">
                    Aguardando jogadores...
                  </p>
                </div>
              )}
            </div>

            {/* STATUS */}

            <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.025] px-5 py-4 text-center">
              <p className="text-xs text-white/30">
                Status da sala
              </p>

              <p className="mt-1 text-sm font-black text-emerald-400">
                Aguardando início
              </p>
            </div>

            {/* BOTÃO INICIAR */}

            {ehCriador && (
              <button
                onClick={iniciarPartida}
                disabled={
                  iniciando ||
                  quantidadeJogadores === 0
                }
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-purple-600 px-5 py-4 text-sm font-black transition hover:bg-purple-500 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {iniciando ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Iniciando partida...
                  </>
                ) : (
                  <>
                    <Play className="h-5 w-5" />
                    Iniciar partida
                  </>
                )}
              </button>
            )}

            {/* MENSAGEM PARA JOGADORES */}

            {!ehCriador && (
              <div className="mt-6 rounded-2xl border border-purple-400/10 bg-purple-500/5 px-5 py-4 text-center">
                <p className="text-sm font-semibold text-white/60">
                  Aguardando o criador iniciar a partida...
                </p>
              </div>
            )}

            {/* SAIR */}

            <button
              onClick={sairDaSala}
              disabled={saindo}
              className="mx-auto mt-6 flex items-center gap-2 rounded-xl px-4 py-3 text-xs font-bold text-white/40 transition hover:bg-white/5 hover:text-white/70 disabled:opacity-40"
            >
              {saindo ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <LogOut className="h-4 w-4" />
              )}

              {saindo
                ? "Saindo..."
                : "Sair da sala"}
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}

export default function Page() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-10 w-10 animate-spin text-purple-400" />

            <p className="text-sm text-white/50">
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