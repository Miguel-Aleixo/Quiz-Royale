"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  useSearchParams,
  useRouter,
} from "next/navigation";

import Cookies from "js-cookie";

import {
  io,
  Socket,
} from "socket.io-client";

import {
  Clock3,
  CheckCircle2,
  Gamepad2,
  Loader2,
  XCircle,
  Trophy,
  Medal,
  ArrowLeft,
  Users,
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

  iniciadaEm: number;
  terminaEm: number;
  agoraServidor: number;
}

interface ResultadoResposta {
  correta: boolean;
  alternativaId: number;
  rodadaId: number;
  acertos?: number;
  tempoTotal?: number;
  eliminado?: boolean;
}

interface ErroSocket {
  mensagem: string;
}

interface JogadorEliminado {
  jogadorId: number;
  usuarioId: number;
  codigo?: string;
  mensagem: string;
  posicaoAtual: number;
  acertos: number;
  tempoTotal: number;
  totalRespostas: number;
  totalJogadores: number;
}

interface RankingJogador {
  posicao: number;
  jogadorId: number;
  usuarioId: number;
  nome: string;
  acertos: number;
  tempoTotal: number;
  totalRespostas: number;
  pontosGanhos?: number;
  pontuacao?: number;
  eliminado?: boolean;
}

interface PartidaFinalizada {
  codigo: string;
  ranking: RankingJogador[];
}

interface ProgressoRespostas {
  respondidos: number;
  total: number;
}

export default function PartidaPage() {
  const searchParams =
    useSearchParams();

  const router =
    useRouter();

  const codigo =
    searchParams.get("codigo");

  const API =
    process.env.NEXT_PUBLIC_API;

  const usuario =
    useToken();

  const usuarioId =
    usuario?.sub;

  const [sala, setSala] =
    useState<Sala | null>(null);

  const [carregando, setCarregando] =
    useState(true);

  const [erro, setErro] =
    useState("");

  const [rodadaAtual, setRodadaAtual] =
    useState(0);

  const [tempoRestante, setTempoRestante] =
    useState(0);

  const [timerAtivo, setTimerAtivo] =
    useState(0);

  /*
   * Guarda o timestamp de término
   * enviado pelo servidor.
   */
  const terminaEmRef =
    useRef(0);

  /*
   * Guarda o timestamp de início
   * enviado pelo servidor.
   */
  const iniciadaEmRef =
    useRef(0);

  const diferencaRelogioRef =
    useRef(0);

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
    jogadorEliminado,
    setJogadorEliminado,
  ] = useState(false);

  const [
    mostrarFeedbackEliminacao,
    setMostrarFeedbackEliminacao,
  ] = useState(false);

  const [
    mensagemEliminacao,
    setMensagemEliminacao,
  ] = useState(
    "Você foi eliminado desta partida.",
  );

  const [
    classificacaoEliminacao,
    setClassificacaoEliminacao,
  ] = useState<{
    posicao: number;
    acertos: number;
    tempoTotal: number;
    totalRespostas: number;
    totalJogadores: number;
  } | null>(null);

  const [
    partidaFinalizada,
    setPartidaFinalizada,
  ] = useState(false);

  const [ranking, setRanking] =
    useState<RankingJogador[]>([]);

  const [
    progressoRespostas,
    setProgressoRespostas,
  ] = useState<ProgressoRespostas>({
    respondidos: 0,
    total: 0,
  });

  /*
   * =========================================================
   * ÁUDIO
   * =========================================================
   */

  const audioContextRef =
    useRef<AudioContext | null>(null);

  function tocarSom(
    tipo:
      | "nova"
      | "clique"
      | "acerto"
      | "erro"
      | "comemoracao",
  ) {
    if (
      typeof window ===
      "undefined"
    ) {
      return;
    }

    try {
      const AudioContextClass =
        window.AudioContext;

      if (!AudioContextClass) {
        return;
      }

      const context =
        audioContextRef.current ??
        new AudioContextClass();

      audioContextRef.current =
        context;

      if (
        context.state ===
        "suspended"
      ) {
        void context.resume();
      }

      const notas = {
        nova: [392, 523],

        clique: [330],

        acerto: [
          523,
          659,
          784,
        ],

        erro: [
          330,
          262,
        ],

        comemoracao: [
          523,
          659,
          784,
          1047,
          1319,
        ],
      }[tipo];

      const agora =
        context.currentTime;

      notas.forEach(
        (
          frequencia,
          index,
        ) => {
          const inicio =
            agora +
            index *
            (tipo ===
              "comemoracao"
              ? 0.13
              : 0.1);

          const oscilador =
            context.createOscillator();

          const ganho =
            context.createGain();

          oscilador.type =
            tipo === "erro"
              ? "sawtooth"
              : tipo ===
                "comemoracao"
                ? "triangle"
                : "sine";

          oscilador.frequency.value =
            frequencia;

          ganho.gain.setValueAtTime(
            0.0001,
            inicio,
          );

          ganho.gain.exponentialRampToValueAtTime(
            0.07,
            inicio + 0.015,
          );

          ganho.gain.exponentialRampToValueAtTime(
            0.0001,
            inicio +
            (tipo ===
              "comemoracao"
              ? 0.3
              : 0.18),
          );

          oscilador.connect(
            ganho,
          );

          ganho.connect(
            context.destination,
          );

          oscilador.start(
            inicio,
          );

          oscilador.stop(
            inicio +
            (tipo ===
              "comemoracao"
              ? 0.32
              : 0.2),
          );
        },
      );
    } catch {
      // Ignora erros do áudio
    }
  }

  /*
   * =========================================================
   * FORMATAR TEMPO
   * =========================================================
   */

  function formatarTempo(
    tempoMs: number,
  ) {
    return `${(
      tempoMs / 1000
    ).toFixed(2)}s`;
  }

  /*
   * =========================================================
   * BUSCAR SALA
   * =========================================================
   */

  useEffect(() => {
    async function buscarPartida() {
      if (!codigo) {
        setErro(
          "Código da sala não informado.",
        );

        setCarregando(false);

        return;
      }

      const token =
        Cookies.get("token");

      if (!token) {
        router.push("/login");

        return;
      }

      if (!API) {
        setErro(
          "API não configurada.",
        );

        setCarregando(false);

        return;
      }

      try {
        setCarregando(true);

        setErro("");

        const res =
          await fetch(
            `${API}/sala/codigo/${codigo}`,
            {
              headers: {
                Authorization:
                  `Bearer ${token}`,
              },
            },
          );

        const data =
          await res.json();

        if (!res.ok) {
          throw new Error(
            Array.isArray(
              data.message,
            )
              ? data.message.join(
                ", ",
              )
              : data.message ||
              "Erro ao buscar partida.",
          );
        }

        setSala(data);
      } catch (error) {
        setErro(
          error instanceof Error
            ? error.message
            : "Erro ao carregar a partida.",
        );
      } finally {
        setCarregando(false);
      }
    }

    buscarPartida();
  }, [
    API,
    codigo,
    router,
  ]);

  /*
   * =========================================================
   * SOCKET
   * =========================================================
   */

  useEffect(() => {
    if (
      !codigo ||
      !API
    ) {
      return;
    }

    const token =
      Cookies.get("token");

    if (!token) {
      router.push("/login");

      return;
    }

    const socketInstance =
      io(API, {
        auth: {
          token,
        },

        transports: [
          "websocket",
        ],
      });

    setSocket(
      socketInstance,
    );

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
          socketInstance.id,
        );

        socketInstance.emit(
          "entrar_partida",
          {
            codigo,
          },
        );
      },
    );

    /*
     * =======================================================
     * PERGUNTA
     * =======================================================
     */

    socketInstance.on(
      "pergunta",
      (
        data: PerguntaSocket,
      ) => {
        console.log(
          "Pergunta recebida:",
          data,
        );

        /*
         * =====================================================
         * SINCRONIZAR RELÓGIO COM O SERVIDOR
         * =====================================================
         *
         * O servidor envia o horário exato em que
         * transmitiu a pergunta.
         *
         * Isso evita problemas caso o relógio do
         * computador esteja adiantado ou atrasado.
         */

        diferencaRelogioRef.current =
          data.agoraServidor - Date.now();

        /*
         * Guardar os timestamps oficiais
         * enviados pelo servidor.
         */

        iniciadaEmRef.current =
          data.iniciadaEm;

        terminaEmRef.current =
          data.terminaEm;

        /*
         * Calcular o tempo restante usando
         * o relógio sincronizado.
         */

        const agoraServidorEstimado =
          Date.now() +
          diferencaRelogioRef.current;

        const restanteMs =
          Math.max(
            0,
            data.terminaEm -
            agoraServidorEstimado,
          );

        /*
         * Atualiza imediatamente a interface.
         */

        setTempoRestante(
          Math.ceil(
            restanteMs / 1000,
          ),
        );

        /*
         * Agora forçamos o timer a iniciar
         * mesmo na primeira rodada.
         *
         * O useEffect abaixo será controlado
         * pelo timestamp terminaEm.
         */

        setTimerAtivo((valor) => valor + 1);

        setAlternativaSelecionada(
          null,
        );

        setResultadoResposta(
          null,
        );
      },
    );

    /*
     * =======================================================
     * PROGRESSO
     * =======================================================
     */

    socketInstance.on(
      "progresso_respostas",
      (
        data: ProgressoRespostas,
      ) => {
        console.log(
          "Progresso das respostas:",
          data,
        );

        setProgressoRespostas({
          respondidos:
            data.respondidos,

          total:
            data.total,
        });
      },
    );

    /*
     * =======================================================
     * RESULTADO
     * =======================================================
     */

    socketInstance.on(
      "resultado_resposta",
      (
        data: ResultadoResposta,
      ) => {
        console.log(
          "Resultado da resposta:",
          data,
        );

        setResultadoResposta(
          data.correta,
        );
      },
    );

    /*
     * =======================================================
     * JOGADOR ELIMINADO
     * =======================================================
     */

    socketInstance.on(
      "jogador_eliminado",
      (
        data: JogadorEliminado,
      ) => {
        console.log(
          "Jogador eliminado:",
          data,
        );

        if (
          Number(
            usuarioId,
          ) ===
          Number(
            data.usuarioId,
          )
        ) {
          setJogadorEliminado(
            true,
          );

          setClassificacaoEliminacao(
            {
              posicao:
                data.posicaoAtual,

              acertos:
                data.acertos,

              tempoTotal:
                data.tempoTotal,

              totalRespostas:
                data.totalRespostas,

              totalJogadores:
                data.totalJogadores,
            },
          );

          setMensagemEliminacao(
            data.mensagem ||
            "Você foi eliminado desta partida.",
          );

          setMostrarFeedbackEliminacao(
            true,
          );

          setAlternativaSelecionada(
            null,
          );

          setResultadoResposta(
            false,
          );

          setTempoRestante(
            0,
          );

          terminaEmRef.current =
            0;

          window.setTimeout(
            () => {
              setMostrarFeedbackEliminacao(
                false,
              );
            },
            2500,
          );
        }
      },
    );

    /*
     * =======================================================
     * PARTIDA FINALIZADA
     * =======================================================
     */

    socketInstance.on(
      "partida_finalizada",
      (
        data: PartidaFinalizada,
      ) => {
        console.log(
          "Partida finalizada:",
          data,
        );

        setRanking(
          data.ranking,
        );

        setMostrarFeedbackEliminacao(
          false,
        );

        setJogadorEliminado(
          false,
        );

        setClassificacaoEliminacao(
          null,
        );

        setPartidaFinalizada(
          true,
        );

        setTempoRestante(
          0,
        );

        terminaEmRef.current =
          0;

        iniciadaEmRef.current =
          0;
      },
    );

    /*
     * =======================================================
     * ERRO AO RESPONDER
     * =======================================================
     */

    socketInstance.on(
      "erro_resposta",
      (
        data: ErroSocket,
      ) => {
        console.error(
          "Erro ao responder:",
          data.mensagem,
        );

        setErro(
          data.mensagem,
        );

        /*
         * Caso a resposta tenha chegado
         * depois do prazo, o servidor
         * pode estar encerrando a rodada.
         */

        if (
          data.mensagem
            .toLowerCase()
            .includes(
              "tempo",
            )
        ) {
          setTempoRestante(
            0,
          );
        }
      },
    );

    /*
     * =======================================================
     * ERRO DA PARTIDA
     * =======================================================
     */

    socketInstance.on(
      "erro_partida",
      (
        data: ErroSocket,
      ) => {
        console.error(
          "Erro da partida:",
          data.mensagem,
        );

        setErro(
          data.mensagem,
        );
      },
    );

    /*
     * =======================================================
     * DESCONECTADO
     * =======================================================
     */

    socketInstance.on(
      "disconnect",
      (
        reason,
      ) => {
        console.log(
          "Desconectado do PartidaGateway:",
          reason,
        );
      },
    );

    /*
     * =======================================================
     * LIMPEZA
     * =======================================================
     */

    return () => {
      console.log(
        "Encerrando conexão do PartidaGateway",
      );

      socketInstance.removeAllListeners();

      socketInstance.disconnect();
    };
  }, [
    codigo,
    API,
    router,
    usuarioId,
  ]);

  /*
   * =========================================================
   * TIMER SINCRONIZADO COM SERVIDOR
   * =========================================================
   */

  useEffect(() => {
    if (
      jogadorEliminado ||
      partidaFinalizada
    ) {
      return;
    }

    if (
      terminaEmRef.current <=
      0
    ) {
      return;
    }

    const atualizarTimer =
      () => {
        const agoraServidorEstimado =
          Date.now() +
          diferencaRelogioRef.current;

        const restanteMs =
          Math.max(
            0,
            terminaEmRef.current -
            agoraServidorEstimado,
          );

        const restanteSegundos =
          Math.ceil(
            restanteMs / 1000,
          );

        setTempoRestante(
          restanteSegundos,
        );
      };

    atualizarTimer();

    const intervalo =
      window.setInterval(
        atualizarTimer,
        100,
      );

    return () => {
      window.clearInterval(
        intervalo,
      );
    };
  }, [
    timerAtivo,
    jogadorEliminado,
    partidaFinalizada,
  ]);

  /*
   * =========================================================
   * SOM DE NOVA PERGUNTA
   * =========================================================
   */

  useEffect(() => {
    if (
      rodadaAtual > 0
    ) {
      tocarSom("nova");
    }
  }, [
    rodadaAtual,
  ]);

  /*
   * =========================================================
   * SOM DA RESPOSTA
   * =========================================================
   */

  useEffect(() => {
    if (
      resultadoResposta ===
      true
    ) {
      tocarSom("acerto");
    }

    if (
      resultadoResposta ===
      false
    ) {
      tocarSom("erro");
    }
  }, [
    resultadoResposta,
  ]);

  /*
   * =========================================================
   * SOM DE FINALIZAÇÃO
   * =========================================================
   */

  useEffect(() => {
    if (
      partidaFinalizada
    ) {
      tocarSom(
        "comemoracao",
      );
    }
  }, [
    partidaFinalizada,
  ]);

  /*
   * =========================================================
   * RODADA ATUAL
   * =========================================================
   */

  const rodada =
    useMemo(() => {
      if (
        !sala?.rodadas?.length
      ) {
        return null;
      }

      const ordenadas =
        [
          ...sala.rodadas,
        ].sort(
          (a, b) =>
            (a.ordem ?? 0) -
            (b.ordem ?? 0),
        );

      return (
        ordenadas[
        rodadaAtual
        ] ?? null
      );
    }, [
      sala,
      rodadaAtual,
    ]);

  /*
   * =========================================================
   * SELECIONAR ALTERNATIVA
   * =========================================================
   */

  function selecionarAlternativa(
    id: number,
  ) {
    if (
      jogadorEliminado
    ) {
      return;
    }

    if (
      partidaFinalizada
    ) {
      return;
    }

    if (
      tempoRestante <= 0
    ) {
      return;
    }

    if (
      alternativaSelecionada !==
      null
    ) {
      return;
    }

    if (!rodada) {
      return;
    }

    if (!socket) {
      setErro(
        "Não foi possível conectar ao servidor.",
      );

      return;
    }

    if (!usuarioId) {
      setErro(
        "Usuário não identificado.",
      );

      return;
    }

    tocarSom("clique");

    setAlternativaSelecionada(
      id,
    );

    /*
     * O valor ainda é enviado por compatibilidade
     * com o evento atual, mas o backend NÃO confia nele.
     */

    const tempoResposta =
      Math.max(
        0,
        Math.min(
          rodada.tempoLimite *
          1000,
          Date.now() -
          iniciadaEmRef.current,
        ),
      );

    socket.emit(
      "responder",
      {
        codigo,

        alternativaId:
          id,

        rodadaId:
          rodada.id,

        tempoResposta,
      },
    );

    console.log(
      "Resposta enviada:",
      {
        codigo,

        alternativaId:
          id,

        rodadaId:
          rodada.id,

        tempoResposta,
      },
    );
  }

  /*
   * =========================================================
   * CARREGANDO
   * =========================================================
   */

  if (carregando) {
    return (
      <main className="flex min-h-screen items-center justify-center overflow-hidden bg-[#070711] text-white">
        <div className="pointer-events-none fixed inset-0 opacity-[0.035] [background-image:linear-gradient(rgba(255,255,255,.8)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.8)_1px,transparent_1px)] [background-size:44px_44px]" />

        <div className="relative flex flex-col items-center gap-5 rounded-3xl border border-white/10 bg-white/[0.045] px-10 py-9 shadow-2xl shadow-fuchsia-950/20 backdrop-blur-xl">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-fuchsia-300/20 bg-fuchsia-500/10">
            <Loader2 className="h-7 w-7 animate-spin text-fuchsia-300" />
          </div>

          <p className="text-sm font-medium text-white/50">
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
      <main className="flex min-h-screen items-center justify-center overflow-hidden bg-[#070711] px-6 text-white">
        <div className="pointer-events-none fixed inset-0 opacity-[0.035] [background-image:linear-gradient(rgba(255,255,255,.8)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.8)_1px,transparent_1px)] [background-size:44px_44px]" />

        <div className="relative w-full max-w-md rounded-[2rem] border border-red-400/20 bg-white/[0.045] p-8 text-center shadow-2xl shadow-red-950/20 backdrop-blur-xl">
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
            className="mt-6 cursor-pointer rounded-xl bg-white/10 px-5 py-3 text-sm font-semibold transition hover:-translate-y-0.5 hover:bg-white/15"
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

  if (
    partidaFinalizada
  ) {
    return (
      <main className="min-h-screen overflow-hidden bg-[#070711] text-white">
        <div className="mx-auto flex min-h-screen w-full max-w-5xl flex-col px-5 py-8 md:px-8">
          <header className="relative text-center">
            <div className="pointer-events-none absolute left-1/2 top-[-180px] h-[360px] w-[560px] -translate-x-1/2 rounded-full bg-yellow-500/10 blur-[120px]" />

            <div className="relative mx-auto flex h-20 w-20 items-center justify-center rounded-[1.5rem] border border-yellow-300/30 bg-gradient-to-br from-yellow-400/25 to-orange-500/10 shadow-2xl shadow-yellow-950/30">
              <Trophy className="h-8 w-8 text-yellow-300" />
            </div>

            <h1 className="relative mt-5 bg-gradient-to-r from-white via-yellow-100 to-orange-300 bg-clip-text text-3xl font-black text-transparent md:text-5xl">
              Partida finalizada!
            </h1>

            <p className="mt-2 text-sm text-white/40">
              Confira a classificação final.
            </p>
          </header>

          <section className="mt-10">
            <div className="overflow-hidden rounded-[2rem] border border-white/[0.09] bg-white/[0.045] shadow-2xl shadow-black/30 backdrop-blur-xl">
              <div className="border-b border-white/10 px-6 py-5 md:px-8">
                <div className="flex items-center gap-3">
                  <Trophy className="h-5 w-5 text-yellow-300" />

                  <div>
                    <h2 className="font-black">
                      Classificação final
                    </h2>

                    <p className="mt-1 text-xs text-white/30">
                      Mais acertos e, em caso de empate,
                      menor tempo médio de resposta.
                    </p>
                  </div>
                </div>
              </div>

              <div className="hidden grid-cols-[70px_minmax(180px,1fr)_120px_150px] gap-4 border-b border-white/10 bg-white/[0.025] px-6 py-4 text-[10px] font-black uppercase tracking-wider text-white/30 md:grid md:px-8">
                <span>Pos.</span>

                <span>Jogador</span>

                <span className="text-center">
                  Acertos
                </span>

                <span className="text-center">
                  Tempo médio
                </span>
              </div>

              <div className="divide-y divide-white/5">
                {ranking.map(
                  (
                    jogador,
                  ) => {
                    const souEu =
                      Number(
                        usuarioId,
                      ) ===
                      Number(
                        jogador.usuarioId,
                      );

                    return (
                      <div
                        key={
                          jogador.jogadorId
                        }
                        className={`px-6 py-5 transition md:px-8 ${souEu
                          ? "bg-purple-500/10"
                          : "bg-transparent"
                          }`}
                      >
                        <div className="grid items-center gap-4 md:grid-cols-[70px_minmax(180px,1fr)_120px_150px]">
                          <div className="flex items-center md:justify-start">
                            <div
                              className={`flex h-10 w-10 items-center justify-center rounded-xl ${jogador.posicao ===
                                1
                                ? "bg-yellow-400/15"
                                : jogador.posicao <=
                                  3
                                  ? "bg-white/10"
                                  : "bg-white/[0.06]"
                                }`}
                            >
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
                                  º
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="min-w-0">
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

                            <p className="mt-1 text-xs text-white/30 md:hidden">
                              {
                                jogador.posicao
                              }
                              º lugar
                            </p>
                          </div>

                          <div className="flex items-center justify-between md:block md:text-center">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-white/30 md:hidden">
                              Acertos
                            </span>

                            <div>
                              <span className="text-lg font-black">
                                {
                                  jogador.acertos
                                }
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center justify-between md:block md:text-center">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-white/30 md:hidden">
                              Tempo médio
                            </span>

                            <div className="flex items-center justify-end gap-1.5 md:justify-center">
                              <Clock3 className="h-4 w-4 text-cyan-300/70" />

                              <span className="text-sm font-black tabular-nums text-white/80">
                                {formatarTempo(
                                  jogador.totalRespostas >
                                    0
                                    ? jogador.tempoTotal /
                                    jogador.totalRespostas
                                    : 0,
                                )}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  },
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

          <div className="mt-8 flex justify-center">
            <button
              onClick={() =>
                router.push("/")
              }
              className="flex cursor-pointer items-center gap-2 rounded-xl bg-white/10 px-5 py-3 text-sm font-bold transition hover:-translate-y-0.5 hover:bg-white/15"
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
   * JOGADOR ELIMINADO
   * =========================================================
   */

  if (
    jogadorEliminado &&
    mostrarFeedbackEliminacao
  ) {
    return (
      <main className="flex min-h-screen items-center justify-center overflow-hidden bg-[#070711] px-6 text-white">
        <div className="pointer-events-none fixed inset-0 bg-red-500/[0.03]" />

        <div className="relative w-full max-w-md rounded-[2rem] border border-red-400/20 bg-white/[0.045] p-8 text-center shadow-2xl shadow-red-950/20 backdrop-blur-xl">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl border border-red-400/20 bg-red-500/10">
            <XCircle className="h-10 w-10 text-red-400" />
          </div>

          <h1 className="mt-6 text-3xl font-black">
            Você foi eliminado!
          </h1>

          <p className="mt-3 text-sm leading-relaxed text-white/40">
            {mensagemEliminacao}

            <br />

            Aguarde o fim da partida para conferir sua posição final.
          </p>

          <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.025] px-5 py-4">
            <p className="text-xs font-bold uppercase tracking-wider text-white/30">
              Resultado
            </p>

            <p className="mt-2 text-lg font-black text-fuchsia-300">
              Aguardando resultado final
            </p>
          </div>

          <button
            onClick={() =>
              router.push("/")
            }
            className="mt-6 flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-white/10 px-5 py-3 text-sm font-bold transition hover:-translate-y-0.5 hover:bg-white/15"
          >
            <ArrowLeft className="h-4 w-4" />

            Voltar para o início
          </button>
        </div>
      </main>
    );
  }

  /*
   * =========================================================
   * AGUARDANDO APÓS ELIMINAÇÃO
   * =========================================================
   */

  if (
    jogadorEliminado &&
    classificacaoEliminacao
  ) {
    const tempoMedio =
      classificacaoEliminacao.totalRespostas >
        0
        ? classificacaoEliminacao.tempoTotal /
        classificacaoEliminacao.totalRespostas
        : 0;

    return (
      <main className="flex min-h-screen items-center justify-center overflow-hidden bg-[#070711] px-6 text-white">
        <div className="pointer-events-none fixed inset-0 bg-fuchsia-500/[0.025]" />

        <div className="relative w-full max-w-md rounded-[2rem] border border-white/[0.08] bg-white/[0.045] p-8 text-center shadow-2xl backdrop-blur-xl">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl border border-fuchsia-400/20 bg-fuchsia-500/10">
            <Trophy className="h-10 w-10 text-fuchsia-300" />
          </div>

          <p className="mt-6 text-xs font-black uppercase tracking-[0.2em] text-white/30">
            Sua classificação atual
          </p>

          <h1 className="mt-2 text-5xl font-black text-white">
            {
              classificacaoEliminacao.posicao
            }
            º
          </h1>

          <p className="mt-2 text-sm text-white/45">
            de{" "}
            {
              classificacaoEliminacao.totalJogadores
            }{" "}
            jogadores
          </p>

          <div className="mt-8 grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-4">
              <p className="text-[10px] font-bold uppercase tracking-wider text-white/25">
                Acertos
              </p>

              <p className="mt-1 text-xl font-black text-emerald-300">
                {
                  classificacaoEliminacao.acertos
                }
              </p>
            </div>

            <div className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-4">
              <p className="text-[10px] font-bold uppercase tracking-wider text-white/25">
                Tempo médio
              </p>

              <p className="mt-1 text-xl font-black text-fuchsia-300">
                {formatarTempo(
                  tempoMedio,
                )}
              </p>
            </div>
          </div>

          <div className="mt-6 rounded-2xl border border-white/[0.07] bg-white/[0.025] px-5 py-4">
            <p className="text-sm font-bold text-white/75">
              Você foi eliminado desta partida.
            </p>

            <p className="mt-2 text-xs leading-relaxed text-white/35">
              Sua classificação atual já está registrada. Aguarde a partida terminar para ver a classificação final de todos os jogadores.
            </p>
          </div>

          <div className="mt-6 flex items-center justify-center gap-2 text-xs font-bold text-white/30">
            <Loader2 className="h-4 w-4 animate-spin" />

            Aguardando resultado final...
          </div>

          <button
            onClick={() =>
              router.push("/")
            }
            className="mt-7 flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-white/10 px-5 py-3 text-sm font-bold transition hover:-translate-y-0.5 hover:bg-white/15"
          >
            <ArrowLeft className="h-4 w-4" />

            Voltar para o início
          </button>
        </div>
      </main>
    );
  }

  /*
   * =========================================================
   * SALA SEM RODADAS
   * =========================================================
   */

  if (
    !sala ||
    !rodada
  ) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#070711] px-6 text-white">
        <div className="text-center">
          <Gamepad2 className="mx-auto h-12 w-12 text-fuchsia-300" />

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
   * PROGRESSO DAS RODADAS
   * =========================================================
   */

  const totalRodadas =
    sala.rodadas.length;

  const progresso =
    (
      (rodadaAtual + 1) /
      totalRodadas
    ) *
    100;

  /*
   * =========================================================
   * TELA DA PARTIDA
   * =========================================================
   */

  return (
    <main className="min-h-screen overflow-hidden bg-[#070711] text-white">
      <div className="pointer-events-none fixed inset-0 opacity-[0.035] [background-image:linear-gradient(rgba(255,255,255,.8)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.8)_1px,transparent_1px)] [background-size:44px_44px]" />

      <div className="pointer-events-none fixed left-1/2 top-[-220px] h-[440px] w-[760px] -translate-x-1/2 rounded-full bg-fuchsia-600/10 blur-[140px]" />

      <div className="relative mx-auto flex min-h-screen w-full max-w-5xl flex-col px-5 py-6 md:px-8">
        <header className="flex items-center justify-between rounded-3xl border border-white/[0.08] bg-white/[0.035] px-4 py-3 backdrop-blur-xl md:px-5">
          <div>
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-fuchsia-500/10 ring-1 ring-fuchsia-300/20">
                <Gamepad2 className="h-5 w-5 text-fuchsia-300" />
              </div>

              <h1 className="text-lg font-black">
                Quiz Royale
              </h1>
            </div>

            <p className="mt-1 text-xs text-white/40">
              {sala.nome} • Sala{" "}
              {sala.codigo}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-3 py-2.5 shadow-lg backdrop-blur-xl">
              <Users className="h-4 w-4 text-fuchsia-300" />

              <span className="text-sm font-black tabular-nums text-white">
                {
                  progressoRespostas.respondidos
                }
                /
                {
                  progressoRespostas.total
                }
              </span>
            </div>

            <div
              className={`flex items-center gap-2 rounded-2xl border px-4 py-2.5 shadow-lg backdrop-blur-xl ${tempoRestante <=
                5
                ? "border-red-400/30 bg-red-500/10 text-red-300"
                : "border-white/10 bg-white/5 text-white"
                }`}
            >
              <Clock3 className="h-5 w-5" />

              <span className="min-w-[32px] text-center text-lg font-black tabular-nums">
                {
                  tempoRestante
                }
                s
              </span>
            </div>
          </div>
        </header>

        <div className="mt-8 rounded-2xl border border-white/[0.06] bg-black/10 p-4">
          <div className="mb-2 flex items-center justify-between text-xs">
            <span className="font-semibold text-white/50">
              Rodada{" "}
              {rodadaAtual +
                1}{" "}
              de{" "}
              {
                totalRodadas
              }
            </span>

            <span className="text-white/30">
              {Math.round(
                progresso,
              )}
              %
            </span>
          </div>

          <div className="h-2 overflow-hidden rounded-full bg-white/10 shadow-inner shadow-black/40">
            <div
              className="h-full rounded-full bg-gradient-to-r from-fuchsia-400 to-violet-500 shadow-[0_0_14px_rgba(217,70,239,.65)] transition-all duration-300"
              style={{
                width: `${progresso}%`,
              }}
            />
          </div>
        </div>

        <section
          key={rodada.id}
          className="mt-10 animate-[quiz-question-in_550ms_cubic-bezier(.22,1,.36,1)]"
        >
          <div className="relative overflow-hidden rounded-[2rem] border border-white/[0.09] bg-white/[0.055] p-7 shadow-2xl shadow-black/30 backdrop-blur-xl md:p-10">
            <div className="pointer-events-none absolute right-[-100px] top-[-100px] h-64 w-64 rounded-full bg-fuchsia-500/10 blur-[90px]" />

            {resultadoResposta ===
              true && (
                <div className="pointer-events-none absolute inset-0 z-10 overflow-hidden">
                  {Array.from(
                    {
                      length: 24,
                    },
                    (
                      _,
                      index,
                    ) => (
                      <span
                        key={
                          index
                        }
                        className="absolute top-[42%] h-2 w-1.5 animate-[confetti-fall_1200ms_ease-out_both] rounded-sm"
                        style={{
                          left: `${6 +
                            ((index *
                              37) %
                              88)
                            }%`,

                          animationDelay: `${(index %
                            8) *
                            45
                            }ms`,

                          backgroundColor:
                            [
                              "#f0abfc",
                              "#c4b5fd",
                              "#fde68a",
                              "#86efac",
                              "#67e8f9",
                            ][
                            index %
                            5
                            ],
                        }}
                      />
                    ),
                  )}
                </div>
              )}

            <div className="flex items-center justify-between gap-4">
              <span className="inline-flex rounded-full border border-fuchsia-300/20 bg-fuchsia-500/10 px-3 py-1 text-xs font-black uppercase tracking-[0.2em] text-fuchsia-300">
                Pergunta{" "}
                {rodadaAtual +
                  1}
              </span>

              <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2">
                <Users className="h-4 w-4 text-fuchsia-300/80" />

                <span className="text-sm font-black tabular-nums text-white">
                  {
                    progressoRespostas.respondidos
                  }
                  /
                  {
                    progressoRespostas.total
                  }
                </span>
              </div>
            </div>

            <h2 className="relative mt-5 max-w-4xl text-2xl font-black leading-tight tracking-tight md:text-4xl">
              {
                rodada
                  .pergunta
                  .enunciado
              }
            </h2>

            <div className="relative mt-8 grid gap-4 md:grid-cols-2">
              {rodada.pergunta.alternativas.map(
                (
                  alternativa,
                  index,
                ) => {
                  const selecionada =
                    alternativaSelecionada ===
                    alternativa.id;

                  const desabilitada =
                    jogadorEliminado ||
                    partidaFinalizada ||
                    tempoRestante <=
                    0 ||
                    alternativaSelecionada !==
                    null;

                  return (
                    <button
                      key={
                        alternativa.id
                      }
                      onClick={() =>
                        selecionarAlternativa(
                          alternativa.id,
                        )
                      }
                      disabled={
                        desabilitada
                      }
                      style={{
                        animationDelay: `${index *
                          70
                          }ms`,
                      }}
                      className={`group flex min-h-[90px] animate-[quiz-option-in_450ms_ease-out_both] items-center gap-4 rounded-2xl border p-5 text-left transition-all duration-200 ${selecionada
                        ? "border-fuchsia-400 bg-fuchsia-500/15 shadow-lg shadow-fuchsia-500/10"
                        : "border-white/10 bg-white/[0.025] hover:-translate-y-0.5 hover:border-fuchsia-400/40 hover:bg-white/[0.06]"
                        } ${desabilitada
                          ? "cursor-not-allowed opacity-50"
                          : "cursor-pointer"
                        }`}
                    >
                      <span
                        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-sm font-black ${selecionada
                          ? "bg-gradient-to-br from-fuchsia-400 to-violet-500 text-white shadow-lg shadow-fuchsia-950/30"
                          : "bg-white/10 text-white/60 group-hover:bg-fuchsia-500/20 group-hover:text-fuchsia-300"
                          }`}
                      >
                        {String.fromCharCode(
                          65 +
                          index,
                        )}
                      </span>

                      <span className="flex-1 font-semibold text-white/90">
                        {
                          alternativa.texto
                        }
                      </span>

                      {selecionada && (
                        <CheckCircle2 className="h-5 w-5 shrink-0 text-fuchsia-300" />
                      )}
                    </button>
                  );
                },
              )}
            </div>

            <div className="mt-8 flex min-h-9 justify-center">
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
                <span className="rounded-xl border border-fuchsia-400/20 bg-fuchsia-500/10 px-4 py-2 text-xs font-bold text-fuchsia-300">
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

        <style jsx global>{`
          @keyframes quiz-question-in {
            from {
              opacity: 0;
              transform: translateY(18px)
                scale(0.985);
            }

            to {
              opacity: 1;
              transform: translateY(0)
                scale(1);
            }
          }

          @keyframes quiz-option-in {
            from {
              opacity: 0;
              transform: translateY(10px);
            }

            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          @keyframes confetti-fall {
            0% {
              opacity: 0;
              transform: translateY(-18px)
                rotate(0deg)
                scale(0.7);
            }

            15% {
              opacity: 1;
            }

            100% {
              opacity: 0;
              transform: translateY(220px)
                rotate(520deg)
                scale(1);
            }
          }
        `}</style>
      </div>
    </main>
  );
}