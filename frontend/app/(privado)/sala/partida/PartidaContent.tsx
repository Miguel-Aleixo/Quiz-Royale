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
  XCircle,
  Trophy,
  Medal,
  ArrowLeft,
} from "lucide-react";

import { useToken } from "@/app/hooks/usuario/useToken";

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

interface ResultadoResposta {
  correta: boolean;
  alternativaId: number;
  rodadaId: number;
}

interface ErroSocket {
  mensagem: string;
}

interface RankingJogador {
  posicao: number;
  jogadorId: number;
  usuarioId: number;
  nome: string;
  pontuacao: number;
}

interface PartidaFinalizada {
  codigo: string;
  ranking: RankingJogador[];
}

export default function PartidaPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const codigo = searchParams.get("codigo");

  const API = process.env.NEXT_PUBLIC_API;

  const usuario = useToken();

  const [sala, setSala] = useState<Sala | null>(null);

  const [carregando, setCarregando] =
    useState(true);

  const [erro, setErro] = useState("");

  const [rodadaAtual, setRodadaAtual] =
    useState(0);

  const [tempoRestante, setTempoRestante] =
    useState(0);

  const [
    alternativaSelecionada,
    setAlternativaSelecionada,
  ] = useState<number | null>(null);

  const [socket, setSocket] =
    useState<Socket | null>(null);

  const [
    resultadoResposta,
    setResultadoResposta,
  ] = useState<boolean | null>(null);

  const [
    partidaFinalizada,
    setPartidaFinalizada,
  ] = useState(false);

  const [
    ranking,
    setRanking,
  ] = useState<RankingJogador[]>([]);

  /*
   * =========================================================
   * BUSCAR SALA
   * =========================================================
   */

  useEffect(() => {
    async function buscarPartida() {
      if (!codigo) {
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
              : data.message ||
                  "Erro ao buscar partida."
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
   * =========================================================
   * CONEXÃO COM O PARTIDA GATEWAY
   * =========================================================
   */

  useEffect(() => {
    if (!codigo || !API) {
      return;
    }

    const token = Cookies.get("token");

    if (!token) {
      router.push("/login");

      return;
    }

    /*
     * O JWT é enviado no handshake.
     *
     * O backend usa esse token para
     * descobrir o Usuario.id.
     */

    const socketInstance = io(API, {
      auth: {
        token,
      },
    });

    setSocket(socketInstance);

    /*
     * =======================================================
     * CONECTOU
     * =======================================================
     */

    socketInstance.on(
      "connect",
      () => {
        console.log(
          "Conectado ao PartidaGateway:",
          socketInstance.id
        );

        /*
         * Entrar na partida.
         *
         * Não enviamos jogadorId.
         */

        socketInstance.emit(
          "entrar_partida",
          {
            codigo,
          }
        );
      }
    );

    /*
     * =======================================================
     * RECEBER PERGUNTA
     * =======================================================
     */

    socketInstance.on(
      "pergunta",
      (data: PerguntaSocket) => {
        console.log(
          "Pergunta recebida:",
          data
        );

        /*
         * Atualiza a rodada.
         */

        setRodadaAtual(
          data.numeroRodada - 1
        );

        /*
         * Reinicia o cronômetro.
         */

        setTempoRestante(
          data.rodada.tempoLimite
        );

        /*
         * Limpa a resposta anterior.
         */

        setAlternativaSelecionada(
          null
        );

        setResultadoResposta(
          null
        );
      }
    );

    /*
     * =======================================================
     * RESULTADO DA RESPOSTA
     * =======================================================
     */

    socketInstance.on(
      "resultado_resposta",
      (data: ResultadoResposta) => {
        console.log(
          "Resultado da resposta:",
          data
        );

        setResultadoResposta(
          data.correta
        );
      }
    );

    /*
     * =======================================================
     * PARTIDA FINALIZADA
     * =======================================================
     */

    socketInstance.on(
      "partida_finalizada",
      (data: PartidaFinalizada) => {
        console.log(
          "Partida finalizada:",
          data
        );

        /*
         * Mostra a tela de ranking.
         */

        setRanking(
          data.ranking
        );

        setPartidaFinalizada(
          true
        );

        /*
         * Para o cronômetro.
         */

        setTempoRestante(0);
      }
    );

    /*
     * =======================================================
     * ERRO AO RESPONDER
     * =======================================================
     */

    socketInstance.on(
      "erro_resposta",
      (data: ErroSocket) => {
        console.error(
          "Erro ao responder:",
          data.mensagem
        );

        setErro(
          data.mensagem
        );
      }
    );

    /*
     * =======================================================
     * ERRO DA PARTIDA
     * =======================================================
     */

    socketInstance.on(
      "erro_partida",
      (data: ErroSocket) => {
        console.error(
          "Erro da partida:",
          data.mensagem
        );

        setErro(
          data.mensagem
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
          "Desconectado do PartidaGateway:",
          reason
        );
      }
    );

    /*
     * =======================================================
     * LIMPEZA
     * =======================================================
     */

    return () => {
      socketInstance.disconnect();
    };
  }, [codigo, API, router]);

  /*
   * =========================================================
   * RODADA ATUAL
   * =========================================================
   */

  const rodada = useMemo(() => {
    if (!sala?.rodadas?.length) {
      return null;
    }

    const ordenadas = [
      ...sala.rodadas,
    ].sort(
      (a, b) =>
        (a.ordem ?? 0) -
        (b.ordem ?? 0)
    );

    return (
      ordenadas[rodadaAtual] ??
      null
    );
  }, [
    sala,
    rodadaAtual,
  ]);

  /*
   * =========================================================
   * CRONÔMETRO
   * =========================================================
   */

  useEffect(() => {
    /*
     * Se a partida acabou,
     * não inicia cronômetro.
     */

    if (partidaFinalizada) {
      return;
    }

    if (!rodada) {
      return;
    }

    setTempoRestante(
      rodada.tempoLimite
    );

    setAlternativaSelecionada(
      null
    );

    setResultadoResposta(
      null
    );

    const intervalo =
      setInterval(() => {
        setTempoRestante(
          (tempo) => {
            if (tempo <= 1) {
              clearInterval(
                intervalo
              );

              return 0;
            }

            return tempo - 1;
          }
        );
      }, 1000);

    return () => {
      clearInterval(
        intervalo
      );
    };
  }, [
    rodada,
    partidaFinalizada,
  ]);

  /*
   * =========================================================
   * SELECIONAR ALTERNATIVA
   * =========================================================
   */

  function selecionarAlternativa(
    id: number
  ) {
    /*
     * Não permite responder
     * depois do tempo.
     */

    if (tempoRestante <= 0) {
      return;
    }

    /*
     * Não permite responder
     * duas vezes.
     */

    if (
      alternativaSelecionada !==
      null
    ) {
      return;
    }

    /*
     * Precisa existir uma rodada.
     */

    if (!rodada) {
      return;
    }

    /*
     * Precisa estar conectado.

     */

    if (!socket) {
      setErro(
        "Não foi possível conectar ao servidor."
      );

      return;
    }

    /*
     * Precisa ter usuário logado.
     */

    if (!usuario?.sub) {
      setErro(
        "Usuário não identificado."
      );

      return;
    }

    /*
     * Seleciona visualmente.
     */

    setAlternativaSelecionada(
      id
    );

    /*
     * Calcula o tempo utilizado.

     * Exemplo:
     *
     * tempo limite = 30
     * tempo restante = 24
     *
     * tempoResposta = 6
     */

    const tempoResposta =
      rodada.tempoLimite -
      tempoRestante;

    /*
     * Envia a resposta.
     *
     * IMPORTANTE:
     *
     * NÃO enviamos jogadorId.
     *
     * O backend pega o Usuario pelo
     * JWT e encontra o Jogador.
     */

    socket.emit(
      "responder",
      {
        codigo,
        alternativaId: id,
        rodadaId: rodada.id,
        tempoResposta,
      }
    );

    console.log(
      "Resposta enviada:",
      {
        codigo,
        alternativaId: id,
        rodadaId: rodada.id,
        tempoResposta,
      }
    );
  }

  /*
   * =========================================================
   * CARREGANDO
   * =========================================================
   */

  if (carregando) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
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
   * =========================================================
   * ERRO
   * =========================================================
   */

  if (erro) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 px-6 text-white">
        <div className="w-full max-w-md rounded-3xl border border-red-400/20 bg-red-500/10 p-8 text-center">
          <XCircle className="mx-auto h-12 w-12 text-red-400" />

          <h1 className="mt-5 text-xl font-bold">
            Não foi possível carregar a partida
          </h1>

          <p className="mt-3 text-sm text-white/50">
            {erro}
          </p>

          <button
            onClick={() =>
              router.back()
            }
            className="mt-6 rounded-xl bg-white/10 px-5 py-3 text-sm font-semibold transition hover:bg-white/15"
          >
            Voltar
          </button>
        </div>
      </main>
    );
  }

  /*
   * =========================================================
   * PARTIDA FINALIZADA
   * =========================================================
   */

  if (partidaFinalizada) {
    return (
      <main className="min-h-screen bg-slate-950 text-white">
        <div className="mx-auto flex min-h-screen w-full max-w-4xl flex-col px-5 py-8 md:px-8">

          {/* HEADER */}

          <header className="text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-yellow-400/20 bg-yellow-500/10">
              <Trophy className="h-8 w-8 text-yellow-300" />
            </div>

            <h1 className="mt-5 text-3xl font-black md:text-4xl">
              Partida finalizada!
            </h1>

            <p className="mt-2 text-sm text-white/40">
              Confira a classificação final.
            </p>
          </header>

          {/* RANKING */}

          <section className="mt-10">
            <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.035] shadow-2xl">

              {/* TÍTULO */}

              <div className="border-b border-white/10 px-6 py-5 md:px-8">
                <div className="flex items-center gap-3">
                  <Trophy className="h-5 w-5 text-yellow-300" />

                  <h2 className="font-black">
                    Ranking final
                  </h2>
                </div>
              </div>

              {/* JOGADORES */}

              <div className="divide-y divide-white/5">
                {ranking.map(
                  (jogador) => {
                    const souEu =
                      Number(
                        usuario?.sub
                      ) ===
                      jogador.usuarioId;

                    return (
                      <div
                        key={
                          jogador.jogadorId
                        }
                        className={`flex items-center gap-4 px-6 py-5 transition md:px-8 ${
                          souEu
                            ? "bg-purple-500/10"
                            : "bg-transparent"
                        }`}
                      >

                        {/* POSIÇÃO */}

                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10">
                          {jogador.posicao ===
                          1 ? (
                            <Trophy className="h-5 w-5 text-yellow-300" />
                          ) : jogador.posicao <=
                            3 ? (
                            <Medal className="h-5 w-5 text-white/60" />
                          ) : (
                            <span className="text-sm font-black text-white/50">
                              {
                                jogador.posicao
                              }
                            </span>
                          )}
                        </div>

                        {/* NOME */}

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <p className="truncate font-bold">
                              {
                                jogador.nome
                              }
                            </p>

                            {souEu && (
                              <span className="shrink-0 rounded-lg bg-purple-500/15 px-2 py-1 text-[10px] font-black uppercase tracking-wider text-purple-300">
                                Você
                              </span>
                            )}
                          </div>

                          <p className="mt-1 text-xs text-white/30">
                            {jogador.posicao}º lugar
                          </p>
                        </div>

                        {/* PONTUAÇÃO */}

                        <div className="text-right">
                          <p className="text-lg font-black">
                            {
                              jogador.pontuacao
                            }
                          </p>

                          <p className="text-[10px] font-bold uppercase tracking-wider text-white/30">
                            pontos
                          </p>
                        </div>
                      </div>
                    );
                  }
                )}

                {ranking.length ===
                  0 && (
                  <div className="px-6 py-12 text-center">
                    <p className="text-sm text-white/40">
                      Nenhum jogador encontrado.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* VOLTAR */}

          <div className="mt-8 flex justify-center">
            <button
              onClick={() =>
                router.back()
              }
              className="flex items-center gap-2 rounded-xl bg-white/10 px-5 py-3 text-sm font-bold transition hover:bg-white/15"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </button>
          </div>
        </div>
      </main>
    );
  }

  /*
   * =========================================================
   * SALA SEM RODADAS
   * =========================================================
   */

  if (!sala || !rodada) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 px-6 text-white">
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

  /*
   * =========================================================
   * PROGRESSO
   * =========================================================
   */

  const totalRodadas =
    sala.rodadas.length;

  const progresso =
    ((rodadaAtual + 1) /
      totalRodadas) *
    100;

  /*
   * =========================================================
   * TELA DA PARTIDA
   * =========================================================
   */

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

            {/* IDENTIFICAÇÃO */}

            <span className="text-xs font-bold uppercase tracking-[0.2em] text-purple-400">
              Pergunta{" "}
              {rodadaAtual + 1}
            </span>

            {/* ENUNCIADO */}

            <h2 className="mt-5 text-2xl font-black leading-tight md:text-4xl">
              {
                rodada.pergunta
                  .enunciado
              }
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
                        tempoRestante <=
                          0 ||
                        alternativaSelecionada !==
                          null
                      }
                      className={`group flex min-h-[90px] items-center gap-4 rounded-2xl border p-5 text-left transition-all duration-200 ${
                        selecionada
                          ? "border-purple-400 bg-purple-500/15 shadow-lg shadow-purple-500/10"
                          : "border-white/10 bg-white/[0.025] hover:border-purple-400/40 hover:bg-white/[0.06]"
                      } ${
                        tempoRestante <=
                          0 ||
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
                          65 +
                            index
                        )}
                      </span>

                      {/* TEXTO */}

                      <span className="flex-1 font-semibold text-white/90">
                        {
                          alternativa.texto
                        }
                      </span>

                      {/* ÍCONE */}

                      {selecionada && (
                        <CheckCircle2 className="h-5 w-5 shrink-0 text-purple-400" />
                      )}
                    </button>
                  );
                }
              )}
            </div>

            {/* RESULTADO */}

            <div className="mt-7 flex justify-center">

              {/* TEMPO ESGOTADO */}

              {tempoRestante ===
              0 ? (
                <span className="rounded-xl border border-red-400/20 bg-red-500/10 px-4 py-2 text-xs font-bold text-red-300">
                  Tempo encerrado
                </span>
              ) : resultadoResposta ===
                true ? (
                <span className="flex items-center gap-2 rounded-xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-2 text-xs font-bold text-emerald-300">
                  <CheckCircle2 className="h-4 w-4" />
                  Resposta correta!
                </span>
              ) : resultadoResposta ===
                false ? (
                <span className="flex items-center gap-2 rounded-xl border border-red-400/20 bg-red-500/10 px-4 py-2 text-xs font-bold text-red-300">
                  <XCircle className="h-4 w-4" />
                  Resposta incorreta!
                </span>
              ) : alternativaSelecionada !==
                null ? (
                <span className="rounded-xl border border-purple-400/20 bg-purple-500/10 px-4 py-2 text-xs font-bold text-purple-300">
                  Resposta enviada
                </span>
              ) : (
                <span className="text-xs text-white/30">
                  Selecione uma alternativa
                </span>
              )}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}