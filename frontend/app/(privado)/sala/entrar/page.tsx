"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Cookies from "js-cookie";
import { io, Socket } from "socket.io-client";
import {
  ArrowLeft,
  Copy,
  Crown,
  Loader2,
  LogOut,
  RefreshCw,
  Shield,
  Users,
  Wifi,
  WifiOff,
} from "lucide-react";

interface Usuario {
  id: number;
  nome: string;
  pontuacao: number | null;
}

interface Jogador {
  id: number;
  usuarioId: number;
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
  criador: Criador | null;
  jogadores: Jogador[];
}

function SalaContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const codigo = searchParams.get("codigo")?.toUpperCase() || "";

  const [sala, setSala] = useState<Sala | null>(null);
  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(true);
  const [saindo, setSaindo] = useState(false);
  const [copiado, setCopiado] = useState(false);
  const [conectado, setConectado] = useState(false);

  const API = process.env.NEXT_PUBLIC_API;

  useEffect(() => {
    if (!codigo) {
      router.push("/sala/entrar");
      return;
    }

    const token = Cookies.get("token");

    if (!token) {
      router.push("/login");
      return;
    }

    if (!API) {
      setErro("API não configurada.");
      setLoading(false);
      return;
    }

    let socket: Socket | null = null;

    async function carregarSala() {
      try {
        setLoading(true);
        setErro("");

        /*
         * Busca inicialmente a sala pela API.
         *
         * Isso garante que a tela tenha os dados mesmo
         * antes do WebSocket estabelecer a conexão.
         */
        const res = await fetch(
          `${API}/sala/codigo/${codigo}`,
          {
            method: "GET",
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
              : data.message || "Sala não encontrada"
          );
        }

        setSala(data);

        /*
         * Depois conecta no WebSocket.
         */
        socket = io(API, {
          transports: ["websocket"],
        });

        socket.on("connect", () => {
          setConectado(true);

          socket?.emit("entrar_sala", {
            codigo,
          });
        });

        socket.on("disconnect", () => {
          setConectado(false);
        });

        socket.on("connect_error", () => {
          setConectado(false);
        });

        /*
         * Recebe atualização da sala.
         */
        socket.on("sala_atualizada", (salaAtualizada: Sala) => {
          setSala(salaAtualizada);
          setErro("");
        });

        /*
         * Recebe erros enviados pelo Gateway.
         */
        socket.on(
          "erro_sala",
          (data: { mensagem?: string }) => {
            setErro(data?.mensagem || "Erro na sala");
          }
        );
      } catch (error) {
        setErro(
          error instanceof Error
            ? error.message
            : "Não foi possível carregar a sala"
        );
      } finally {
        setLoading(false);
      }
    }

    carregarSala();

    return () => {
      socket?.disconnect();
    };
  }, [API, codigo, router]);

  async function sairDaSala() {
    if (!codigo) return;

    const token = Cookies.get("token");

    if (!token) {
      router.push("/login");
      return;
    }

    try {
      setSaindo(true);
      setErro("");

      const res = await fetch(
        `${API}/sala/sair/${codigo}`,
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
            : data.message || "Não foi possível sair da sala"
        );
      }

      router.push("/");
    } catch (error) {
      setErro(
        error instanceof Error
          ? error.message
          : "Erro ao sair da sala"
      );
    } finally {
      setSaindo(false);
    }
  }

  async function copiarCodigo() {
    if (!codigo) return;

    try {
      await navigator.clipboard.writeText(codigo);

      setCopiado(true);

      setTimeout(() => {
        setCopiado(false);
      }, 2000);
    } catch {
      setErro("Não foi possível copiar o código.");
    }
  }

  function voltar() {
    router.push("/");
  }

  /*
   * Loading inicial
   */
  if (loading) {
    return (
      <main className="min-h-screen bg-[#080712] text-white">
        <div className="flex min-h-screen items-center justify-center px-6">
          <div className="flex flex-col items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-purple-400/20 bg-purple-500/10">
              <Loader2
                size={26}
                className="animate-spin text-purple-300"
              />
            </div>

            <div className="text-center">
              <p className="font-bold text-white">
                Entrando na sala...
              </p>

              <p className="mt-1 text-sm text-white/40">
                Aguarde um momento
              </p>
            </div>
          </div>
        </div>
      </main>
    );
  }

  /*
   * Sala não carregada
   */
  if (!sala) {
    return (
      <main className="min-h-screen bg-[#080712] text-white">
        <div className="flex min-h-screen items-center justify-center px-6">
          <div className="w-full max-w-md rounded-3xl border border-white/10 bg-white/[0.03] p-8 text-center shadow-2xl shadow-black/20">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-500/10">
              <WifiOff
                size={25}
                className="text-red-300"
              />
            </div>

            <h1 className="mt-5 text-xl font-black">
              Não foi possível entrar
            </h1>

            <p className="mt-2 text-sm leading-6 text-white/45">
              {erro || "Sala não encontrada."}
            </p>

            <button
              type="button"
              onClick={voltar}
              className="mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-purple-600 text-sm font-bold transition hover:bg-purple-500"
            >
              <ArrowLeft size={17} />
              Voltar
            </button>
          </div>
        </div>
      </main>
    );
  }

  const quantidadeJogadores = sala.jogadores?.length || 0;

  const vagasRestantes =
    sala.maxJogadores - quantidadeJogadores;

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#080712] text-white">
      {/* Background */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-[-250px] h-[500px] w-[700px] -translate-x-1/2 rounded-full bg-purple-600/10 blur-[120px]" />

        <div className="absolute bottom-[-200px] left-[-150px] h-[400px] w-[400px] rounded-full bg-indigo-600/10 blur-[120px]" />
      </div>

      {/* Header */}
      <header className="relative z-10 border-b border-white/[0.06] bg-[#080712]/80 backdrop-blur-xl">
        <div className="mx-auto flex h-20 max-w-6xl items-center justify-between px-5 sm:px-8">
          <button
            type="button"
            onClick={voltar}
            className="flex items-center gap-2 text-sm font-bold text-white/50 transition hover:text-white"
          >
            <ArrowLeft size={18} />
            Voltar
          </button>

          <div className="flex items-center gap-2">
            {conectado ? (
              <>
                <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-lg shadow-emerald-400/50" />

                <span className="text-xs font-bold text-emerald-300">
                  Conectado
                </span>
              </>
            ) : (
              <>
                <span className="h-2 w-2 rounded-full bg-yellow-400" />

                <span className="text-xs font-bold text-yellow-300">
                  Conectando...
                </span>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Conteúdo */}
      <section className="relative z-10 mx-auto w-full max-w-6xl px-5 py-8 sm:px-8 sm:py-12">
        {/* Erro */}
        {erro && (
          <div className="mb-6 flex items-start gap-3 rounded-2xl border border-red-400/20 bg-red-500/[0.06] px-4 py-3 text-sm text-red-200">
            <WifiOff
              size={18}
              className="mt-0.5 shrink-0"
            />

            <span>{erro}</span>
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
          {/* Coluna esquerda */}
          <div className="space-y-6">
            {/* Card da sala */}
            <div className="rounded-3xl border border-white/10 bg-white/[0.035] p-6 shadow-2xl shadow-black/20 backdrop-blur-xl sm:p-8">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-purple-300/70">
                    Sala
                  </p>

                  <h1 className="mt-2 text-2xl font-black tracking-tight sm:text-3xl">
                    {sala.nome}
                  </h1>
                </div>

                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-purple-400/20 bg-purple-500/10">
                  <Shield
                    size={21}
                    className="text-purple-300"
                  />
                </div>
              </div>

              {/* Código */}
              <div className="mt-8 rounded-2xl border border-white/10 bg-black/20 p-5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-widest text-white/35">
                    Código da sala
                  </span>

                  <button
                    type="button"
                    onClick={copiarCodigo}
                    className="flex items-center gap-1.5 text-xs font-bold text-purple-300 transition hover:text-purple-200"
                  >
                    <Copy size={14} />

                    {copiado ? "Copiado!" : "Copiar"}
                  </button>
                </div>

                <p className="mt-3 text-center font-mono text-4xl font-black tracking-[0.25em] text-white sm:text-5xl">
                  {sala.codigo}
                </p>

                <p className="mt-3 text-center text-xs text-white/30">
                  Compartilhe este código para outros jogadores entrarem.
                </p>
              </div>

              {/* Status */}
              <div className="mt-5 grid grid-cols-2 gap-3">
                <div className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-4">
                  <div className="flex items-center gap-2 text-white/35">
                    <Users size={15} />

                    <span className="text-xs font-bold">
                      Jogadores
                    </span>
                  </div>

                  <p className="mt-2 text-xl font-black">
                    {quantidadeJogadores}
                    <span className="ml-1 text-sm font-semibold text-white/25">
                      / {sala.maxJogadores}
                    </span>
                  </p>
                </div>

                <div className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-4">
                  <div className="flex items-center gap-2 text-white/35">
                    <Wifi size={15} />

                    <span className="text-xs font-bold">
                      Status
                    </span>
                  </div>

                  <p className="mt-2 text-sm font-black capitalize text-emerald-300">
                    {sala.status}
                  </p>
                </div>
              </div>

              {/* Vagas */}
              <div className="mt-5">
                <div className="mb-2 flex items-center justify-between text-xs">
                  <span className="font-semibold text-white/35">
                    Ocupação
                  </span>

                  <span className="font-bold text-white/50">
                    {vagasRestantes > 0
                      ? `${vagasRestantes} vaga${
                          vagasRestantes === 1 ? "" : "s"
                        } disponível${
                          vagasRestantes === 1 ? "" : "eis"
                        }`
                      : "Sala cheia"}
                  </span>
                </div>

                <div className="h-2 overflow-hidden rounded-full bg-white/[0.06]">
                  <div
                    className="h-full rounded-full bg-purple-500 transition-all duration-500"
                    style={{
                      width: `${Math.min(
                        (quantidadeJogadores /
                          sala.maxJogadores) *
                          100,
                        100
                      )}%`,
                    }}
                  />
                </div>
              </div>

              {/* Sair */}
              <button
                type="button"
                onClick={sairDaSala}
                disabled={saindo}
                className="mt-7 flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-red-400/20 bg-red-500/[0.04] text-sm font-bold text-red-300 transition hover:border-red-400/40 hover:bg-red-500/[0.08] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saindo ? (
                  <>
                    <Loader2
                      size={17}
                      className="animate-spin"
                    />

                    Saindo...
                  </>
                ) : (
                  <>
                    <LogOut size={17} />

                    Sair da sala
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Coluna direita */}
          <div className="rounded-3xl border border-white/10 bg-white/[0.035] shadow-2xl shadow-black/20 backdrop-blur-xl">
            {/* Header jogadores */}
            <div className="flex items-center justify-between border-b border-white/[0.06] px-6 py-5 sm:px-7">
              <div>
                <div className="flex items-center gap-2">
                  <Users
                    size={19}
                    className="text-purple-300"
                  />

                  <h2 className="font-black">
                    Jogadores
                  </h2>
                </div>

                <p className="mt-1 text-xs text-white/30">
                  Aguardando o início da partida
                </p>
              </div>

              <div className="flex h-9 min-w-9 items-center justify-center rounded-xl bg-purple-500/10 px-2.5 text-sm font-black text-purple-300">
                {quantidadeJogadores}
              </div>
            </div>

            {/* Lista */}
            <div className="p-4 sm:p-5">
              {quantidadeJogadores === 0 ? (
                <div className="flex min-h-[300px] flex-col items-center justify-center text-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03]">
                    <Users
                      size={24}
                      className="text-white/25"
                    />
                  </div>

                  <p className="mt-4 font-bold text-white/60">
                    Nenhum jogador
                  </p>

                  <p className="mt-1 max-w-xs text-xs leading-5 text-white/30">
                    Compartilhe o código da sala para chamar outros jogadores.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {sala.jogadores.map(
                    (jogador, index) => {
                      const ehCriador =
                        sala.criador?.id ===
                        jogador.usuario.id;

                      return (
                        <div
                          key={jogador.id}
                          className="group flex items-center gap-3 rounded-2xl border border-white/[0.06] bg-white/[0.02] px-4 py-3 transition hover:border-white/10 hover:bg-white/[0.04]"
                        >
                          {/* Número */}
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/[0.05] text-xs font-black text-white/35">
                            {index + 1}
                          </div>

                          {/* Avatar */}
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500/30 to-indigo-500/20 text-sm font-black text-purple-200">
                            {jogador.usuario.nome
                              .charAt(0)
                              .toUpperCase()}
                          </div>

                          {/* Nome */}
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <p className="truncate text-sm font-bold text-white/85">
                                {jogador.usuario.nome}
                              </p>

                              {ehCriador && (
                                <span className="flex shrink-0 items-center gap-1 rounded-lg border border-yellow-400/20 bg-yellow-400/[0.06] px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wide text-yellow-300">
                                  <Crown size={10} />
                                  Criador
                                </span>
                              )}
                            </div>

                            <p className="mt-0.5 text-[11px] text-white/25">
                              Jogador
                            </p>
                          </div>
                        </div>
                      );
                    }
                  )}
                </div>
              )}
            </div>

            {/* Rodapé */}
            <div className="border-t border-white/[0.06] px-6 py-5 sm:px-7">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-purple-500/10">
                  <RefreshCw
                    size={15}
                    className="text-purple-300"
                  />
                </div>

                <div>
                  <p className="text-xs font-bold text-white/60">
                    Sala atualizada em tempo real
                  </p>

                  <p className="mt-0.5 text-[11px] text-white/25">
                    A lista será atualizada automaticamente.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

export default function EntrarSalaPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-[#080712] text-white">
          <Loader2
            size={28}
            className="animate-spin text-purple-400"
          />
        </main>
      }
    >
      <SalaContent />
    </Suspense>
  );
}