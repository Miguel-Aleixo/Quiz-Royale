"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Cookies from "js-cookie";
import { io, Socket } from "socket.io-client";
import {
  Clock3,
  CheckCircle2,
  Gamepad2,
  Loader2,
} from "lucide-react";

interface Alternativa {
  id: number;
  texto: string;
}

interface Pergunta {
  id: number;
  enunciado: string;
  alternativas: Alternativa[];
}

interface Rodada {
  id: number;
  ordem: number | null;
  tempoLimite: number;
  pergunta: Pergunta;
}

interface Sala {
  id: number;
  nome: string;
  codigo: string;
  status: string;
  maxJogadores: number;
  rodadas: Rodada[];
}

interface PerguntaSocket {
  rodada: Rodada;
  numeroRodada: number;
  totalRodadas: number;
}

export default function PartidaPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const codigo = searchParams.get("codigo");

  const API = process.env.NEXT_PUBLIC_API;

  const [sala, setSala] = useState<Sala | null>(null);

  const [carregando, setCarregando] = useState(true);

  const [erro, setErro] = useState("");

  const [rodadaAtual, setRodadaAtual] = useState(0);

  const [tempoRestante, setTempoRestante] = useState(0);

  const [alternativaSelecionada, setAlternativaSelecionada] =
    useState<number | null>(null);

  const [socket, setSocket] = useState<Socket | null>(null);

  /*
   * Busca a sala e suas rodadas
   */
  useEffect(() => {
    async function buscarPartida() {
      if (!codigo) {
        setErro("Código da sala não informado.");
        setCarregando(false);
        return;
      }

      const token = Cookies.get("token");

      if (!token) {
        router.push("/login");
        return;
      }

      try {
        setCarregando(true);
        setErro("");

        const res = await fetch(
          `${API}/sala/codigo/${codigo}`,
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
              : data.message || "Erro ao buscar partida."
          );
        }

        setSala(data);
      } catch (error) {
        setErro(
          error instanceof Error
            ? error.message
            : "Erro ao carregar a partida."
        );
      } finally {
        setCarregando(false);
      }
    }

    buscarPartida();
  }, [API, codigo, router]);

  /*
   * Conexão com o PartidaGateway
   */
  useEffect(() => {
    if (!codigo || !API) return;

    const socketInstance = io(API);

    setSocket(socketInstance);

    socketInstance.on("connect", () => {
      console.log(
        "Conectado ao PartidaGateway:",
        socketInstance.id
      );

      socketInstance.emit("entrar_partida", {
        codigo,
      });
    });

    /*
     * Recebe a pergunta da partida
     */
    socketInstance.on(
      "pergunta",
      (data: PerguntaSocket) => {
        console.log(
          "Pergunta recebida pelo Socket:",
          data
        );

        setRodadaAtual(data.numeroRodada - 1);

        setTempoRestante(
          data.rodada.tempoLimite
        );

        setAlternativaSelecionada(null);
      }
    );

    /*
     * Erro enviado pelo Gateway
     */
    socketInstance.on(
      "erro_partida",
      (data: { mensagem: string }) => {
        console.error(
          "Erro da partida:",
          data.mensagem
        );

        setErro(data.mensagem);
      }
    );

    /*
     * Desconectado
     */
    socketInstance.on("disconnect", () => {
      console.log(
        "Desconectado do PartidaGateway"
      );
    });

    return () => {
      socketInstance.disconnect();
    };
  }, [codigo, API]);

  /*
   * Rodada atual
   */
  const rodada = useMemo(() => {
    if (!sala?.rodadas?.length) {
      return null;
    }

    const ordenadas = [...sala.rodadas].sort(
      (a, b) =>
        (a.ordem ?? 0) -
        (b.ordem ?? 0)
    );

    return (
      ordenadas[rodadaAtual] ?? null
    );
  }, [sala, rodadaAtual]);

  /*
   * Cronômetro
   */
  useEffect(() => {
    if (!rodada) return;

    setTempoRestante(
      rodada.tempoLimite
    );

    setAlternativaSelecionada(null);

    const intervalo = setInterval(() => {
      setTempoRestante((tempo) => {
        if (tempo <= 1) {
          clearInterval(intervalo);

          return 0;
        }

        return tempo - 1;
      });
    }, 1000);

    return () => {
      clearInterval(intervalo);
    };
  }, [rodada]);

  /*
   * Escolher alternativa
   */
  function selecionarAlternativa(
    id: number
  ) {
    if (tempoRestante <= 0) {
      return;
    }

    if (alternativaSelecionada !== null) {
      return;
    }

    setAlternativaSelecionada(id);
  }

  /*
   * Carregando
   */
  if (carregando) {
    return (
      <main className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-purple-400" />

          <p className="text-sm text-white/50">
            Carregando partida...
          </p>
        </div>
      </main>
    );
  }

  /*
   * Erro
   */
  if (erro) {
    return (
      <main className="min-h-screen bg-slate-950 text-white flex items-center justify-center px-6">
        <div className="w-full max-w-md rounded-3xl border border-red-400/20 bg-red-500/10 p-8 text-center">
          <h1 className="text-xl font-bold">
            Não foi possível carregar a partida
          </h1>

          <p className="mt-3 text-sm text-white/50">
            {erro}
          </p>

          <button
            onClick={() => router.back()}
            className="mt-6 rounded-xl bg-white/10 px-5 py-3 text-sm font-semibold transition hover:bg-white/15"
          >
            Voltar
          </button>
        </div>
      </main>
    );
  }

  /*
   * Sala sem rodadas
   */
  if (!sala || !rodada) {
    return (
      <main className="min-h-screen bg-slate-950 text-white flex items-center justify-center px-6">
        <div className="text-center">
          <Gamepad2 className="mx-auto h-12 w-12 text-purple-400" />

          <h1 className="mt-5 text-2xl font-bold">
            Nenhuma pergunta disponível
          </h1>

          <p className="mt-2 text-sm text-white/50">
            Essa sala ainda não possui rodadas cadastradas.
          </p>
        </div>
      </main>
    );
  }

  const totalRodadas =
    sala.rodadas.length;

  const progresso =
    ((rodadaAtual + 1) /
      totalRodadas) *
    100;

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto flex min-h-screen w-full max-w-5xl flex-col px-5 py-6 md:px-8">

        {/* HEADER */}
        <header className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Gamepad2 className="h-6 w-6 text-purple-400" />

              <h1 className="text-lg font-black">
                Quiz Royale
              </h1>
            </div>

            <p className="mt-1 text-xs text-white/40">
              {sala.nome} • Sala{" "}
              {sala.codigo}
            </p>
          </div>

          {/* CRONÔMETRO */}
          <div
            className={`flex items-center gap-2 rounded-2xl border px-4 py-3 ${
              tempoRestante <= 5
                ? "border-red-400/30 bg-red-500/10 text-red-300"
                : "border-white/10 bg-white/5 text-white"
            }`}
          >
            <Clock3 className="h-5 w-5" />

            <span className="min-w-[32px] text-center text-lg font-black tabular-nums">
              {tempoRestante}s
            </span>
          </div>
        </header>

        {/* PROGRESSO */}
        <div className="mt-8">
          <div className="mb-2 flex items-center justify-between text-xs">
            <span className="font-semibold text-white/50">
              Rodada{" "}
              {rodadaAtual + 1} de{" "}
              {totalRodadas}
            </span>

            <span className="text-white/30">
              {Math.round(
                progresso
              )}
              %
            </span>
          </div>

          <div className="h-2 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-purple-500 transition-all duration-300"
              style={{
                width: `${progresso}%`,
              }}
            />
          </div>
        </div>

        {/* PERGUNTA */}
        <section className="mt-10">
          <div className="rounded-[2rem] border border-white/10 bg-white/[0.035] p-7 shadow-2xl md:p-10">

            <span className="text-xs font-bold uppercase tracking-[0.2em] text-purple-400">
              Pergunta{" "}
              {rodadaAtual + 1}
            </span>

            <h2 className="mt-5 text-2xl font-black leading-tight md:text-4xl">
              {rodada.pergunta.enunciado}
            </h2>

            {/* ALTERNATIVAS */}
            <div className="mt-8 grid gap-4 md:grid-cols-2">
              {rodada.pergunta.alternativas.map(
                (
                  alternativa,
                  index
                ) => {
                  const selecionada =
                    alternativaSelecionada ===
                    alternativa.id;

                  return (
                    <button
                      key={
                        alternativa.id
                      }
                      onClick={() =>
                        selecionarAlternativa(
                          alternativa.id
                        )
                      }
                      disabled={
                        tempoRestante <= 0 ||
                        alternativaSelecionada !==
                          null
                      }
                      className={`group flex min-h-[90px] items-center gap-4 rounded-2xl border p-5 text-left transition-all duration-200 ${
                        selecionada
                          ? "border-purple-400 bg-purple-500/15 shadow-lg shadow-purple-500/10"
                          : "border-white/10 bg-white/[0.025] hover:border-purple-400/40 hover:bg-white/[0.06]"
                      } ${
                        tempoRestante <= 0 ||
                        alternativaSelecionada !==
                          null
                          ? "cursor-not-allowed opacity-50"
                          : "cursor-pointer"
                      }`}
                    >
                      {/* LETRA */}
                      <span
                        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-sm font-black ${
                          selecionada
                            ? "bg-purple-500 text-white"
                            : "bg-white/10 text-white/60 group-hover:bg-purple-500/20 group-hover:text-purple-300"
                        }`}
                      >
                        {String.fromCharCode(
                          65 + index
                        )}
                      </span>

                      {/* TEXTO */}
                      <span className="flex-1 font-semibold text-white/90">
                        {
                          alternativa.texto
                        }
                      </span>

                      {selecionada && (
                        <CheckCircle2 className="h-5 w-5 shrink-0 text-purple-400" />
                      )}
                    </button>
                  );
                }
              )}
            </div>

            {/* STATUS */}
            <div className="mt-7 flex justify-center">
              {tempoRestante ===
              0 ? (
                <span className="rounded-xl border border-red-400/20 bg-red-500/10 px-4 py-2 text-xs font-bold text-red-300">
                  Tempo encerrado
                </span>
              ) : alternativaSelecionada !==
                null ? (
                <span className="rounded-xl border border-purple-400/20 bg-purple-500/10 px-4 py-2 text-xs font-bold text-purple-300">
                  Alternativa selecionada
                </span>
              ) : (
                <span className="text-xs text-white/30">
                  Selecione uma
                  alternativa
                </span>
              )}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}