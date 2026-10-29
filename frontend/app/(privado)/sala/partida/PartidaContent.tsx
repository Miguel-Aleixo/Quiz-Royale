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

  // A rodada enviada pelo servidor é a fonte da verdade.
  // Não dependemos apenas do índice local para escolher a pergunta.
  const [rodadaRecebida, setRodadaRecebida] =
    useState<Rodada | null>(null);

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

        // Sincroniza o índice e a rodada real com o servidor.
        // Isso impede que o front continue enviando o ID da pergunta anterior.
        if (data.rodada) {
          setRodadaRecebida(data.rodada);
        }

        if (Number.isFinite(data.numeroRodada) && data.numeroRodada >= 1) {
          setRodadaAtual(data.numeroRodada - 1);
        }

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
        rodadaRecebida ??
        ordenadas[rodadaAtual] ??
        null
      );
    }, [
      sala,
      rodadaAtual,
      rodadaRecebida,
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
    const topTres = ranking.slice(0, 3);
    const demaisJogadores = ranking.slice(3);

    const medalhas = [
      { lugar: 1, emoji: "👑", titulo: "CAMPEÃO", cor: "from-yellow-300 via-amber-400 to-orange-500", brilho: "shadow-yellow-500/25", borda: "border-yellow-300/40", altura: "md:translate-y-0", texto: "text-yellow-200" },
      { lugar: 2, emoji: "🥈", titulo: "VICE-CAMPEÃO", cor: "from-slate-200 via-slate-300 to-slate-500", brilho: "shadow-slate-300/20", borda: "border-slate-200/30", altura: "md:translate-y-8", texto: "text-slate-200" },
      { lugar: 3, emoji: "🥉", titulo: "TERCEIRO LUGAR", cor: "from-orange-300 via-amber-600 to-orange-800", brilho: "shadow-orange-500/20", borda: "border-orange-300/30", altura: "md:translate-y-8", texto: "text-orange-200" },
    ];

    const renderJogador = (jogador: RankingJogador, destaque = false) => {
      const souEu = Number(usuarioId) === Number(jogador.usuarioId);
      const tempoMedio = jogador.totalRespostas > 0
        ? jogador.tempoTotal / jogador.totalRespostas
        : 0;

      return (
        <div
          key={jogador.jogadorId}
          className={`group relative overflow-hidden rounded-2xl border transition-all duration-300 hover:-translate-y-1 ${
            souEu
              ? "border-fuchsia-300/50 bg-fuchsia-500/[0.13] shadow-lg shadow-fuchsia-950/20"
              : "border-white/[0.07] bg-[#17172a]/75 hover:border-white/20 hover:bg-[#202039]"
          } ${destaque ? "p-4 md:p-5" : "p-3 md:p-4"}`}
        >
          {souEu && <div className="pointer-events-none absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-fuchsia-300 to-violet-500" />}
          <div className="flex items-center gap-3">
            <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl font-black ${
              jogador.posicao === 1 ? "bg-yellow-400/15 text-yellow-200" :
              jogador.posicao === 2 ? "bg-slate-300/15 text-slate-200" :
              jogador.posicao === 3 ? "bg-orange-400/15 text-orange-200" :
              "bg-white/[0.06] text-white/50"
            }`}>
              {jogador.posicao <= 3 ? (
                <span className="text-xl">{jogador.posicao === 1 ? "👑" : jogador.posicao === 2 ? "🥈" : "🥉"}</span>
              ) : <span>{jogador.posicao}º</span>}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex min-w-0 items-center gap-2">
                <p className="truncate text-sm font-black text-white">{jogador.nome}</p>
                {souEu && <span className="shrink-0 rounded-full bg-fuchsia-400/15 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-fuchsia-200">Você</span>}
              </div>
              <p className="mt-1 text-[10px] font-semibold text-white/35">
                {jogador.posicao === 1 ? "Lenda da rodada" : jogador.posicao <= 3 ? "No pódio" : "Participante"}
              </p>
            </div>

            <div className="flex shrink-0 items-center gap-4 text-right">
              <div>
                <p className="text-[9px] font-black uppercase tracking-wider text-white/30">Acertos</p>
                <p className="mt-0.5 text-lg font-black tabular-nums text-emerald-300">{jogador.acertos}</p>
              </div>
              <div className="hidden min-w-[76px] sm:block">
                <p className="text-[9px] font-black uppercase tracking-wider text-white/30">Tempo médio</p>
                <p className="mt-1 flex items-center justify-end gap-1 text-xs font-bold tabular-nums text-cyan-200">
                  <Clock3 className="h-3 w-3" />
                  {formatarTempo(tempoMedio)}
                </p>
              </div>
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between border-t border-white/[0.06] pt-2 sm:hidden">
            <span className="text-[10px] text-white/35">Tempo médio por resposta</span>
            <span className="text-xs font-bold tabular-nums text-cyan-200">{formatarTempo(tempoMedio)}</span>
          </div>
        </div>
      );
    };

    return (
      <main className="relative min-h-screen overflow-hidden bg-[#090817] text-white">
        <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(168,85,247,.22),transparent_48%),radial-gradient(ellipse_at_0%_70%,rgba(34,211,238,.10),transparent_35%),radial-gradient(ellipse_at_100%_65%,rgba(244,114,182,.10),transparent_35%)]" />
        <div className="pointer-events-none fixed inset-0 opacity-[0.045] [background-image:radial-gradient(#fff_1px,transparent_1px)] [background-size:22px_22px]" />

        <div className="pointer-events-none fixed inset-0 overflow-hidden">
          {Array.from({ length: 18 }, (_, i) => (
            <span
              key={i}
              className="absolute h-2 w-2 animate-[ranking-float_5s_ease-in-out_infinite] rounded-[3px] opacity-50"
              style={{
                left: `${(i * 37) % 100}%`,
                top: `${(i * 23) % 100}%`,
                backgroundColor: ["#f9a8d4", "#a5b4fc", "#67e8f9", "#fde68a"][i % 4],
                animationDelay: `${(i % 7) * -0.6}s`,
              }}
            />
          ))}
        </div>

        <div className="relative mx-auto flex min-h-screen w-full max-w-5xl flex-col px-4 py-8 sm:px-6 md:px-8">
          <header className="relative mx-auto max-w-2xl text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 animate-[trophy-bounce_2.4s_ease-in-out_infinite] items-center justify-center rounded-[1.4rem] border border-yellow-200/30 bg-gradient-to-br from-yellow-300/25 to-orange-500/10 shadow-xl shadow-yellow-500/10">
              <Trophy className="h-8 w-8 text-yellow-200" />
            </div>
            <span className="inline-flex rounded-full border border-fuchsia-300/20 bg-fuchsia-400/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.25em] text-fuchsia-200">
              Fim de jogo
            </span>
            <h1 className="mt-4 text-3xl font-black tracking-tight sm:text-5xl">
              <span className="bg-gradient-to-r from-white via-yellow-100 to-fuchsia-200 bg-clip-text text-transparent">Que disputa incrível!</span>
            </h1>
            <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-white/45">
              A arena chegou ao fim. Confira quem dominou o Quiz Royale!
            </p>
          </header>

          {topTres.length > 0 && (
            <section className="mt-12">
              <div className="mb-6 flex items-center justify-center gap-2">
                <Medal className="h-4 w-4 text-yellow-200" />
                <h2 className="text-xs font-black uppercase tracking-[0.25em] text-white/55">Pódio dos campeões</h2>
                <Medal className="h-4 w-4 text-yellow-200" />
              </div>

              <div className="mx-auto grid max-w-3xl grid-cols-3 items-end gap-2 sm:gap-5">
                {[topTres[1], topTres[0], topTres[2]].filter(Boolean).map((jogador, index) => {
                  const config = medalhas[jogador.posicao - 1] ?? medalhas[2];
                  const souEu = Number(usuarioId) === Number(jogador.usuarioId);
                  const tempoMedio = jogador.totalRespostas > 0 ? jogador.tempoTotal / jogador.totalRespostas : 0;
                  const primeiro = jogador.posicao === 1;

                  return (
                    <div
                      key={jogador.jogadorId}
                      style={{ animationDelay: `${index * 150}ms` }}
                      className={`relative flex min-w-0 animate-[podium-enter_800ms_cubic-bezier(.16,1,.3,1)_both] flex-col items-center rounded-t-[1.5rem] rounded-b-xl border ${config.borda} bg-gradient-to-b ${config.cor} ${config.brilho} p-[1px] shadow-2xl ${primeiro ? "z-10" : "z-0"} ${primeiro ? "min-h-[245px]" : "min-h-[205px]"}`}
                    >
                      <div className="flex h-full w-full flex-1 flex-col items-center rounded-t-[calc(1.5rem-1px)] rounded-b-[11px] bg-[#171426]/95 px-2 pb-4 pt-4 sm:px-4">
                        <span className={`text-[9px] font-black tracking-[0.16em] sm:text-[10px] ${config.texto}`}>{config.titulo}</span>
                        <div className={`mt-3 flex ${primeiro ? "h-16 w-16 text-4xl" : "h-12 w-12 text-3xl"} animate-[trophy-bounce_2.6s_ease-in-out_infinite] items-center justify-center rounded-2xl bg-gradient-to-br ${config.cor} shadow-lg`}>
                          {config.emoji}
                        </div>
                        <p className="mt-3 w-full truncate text-center text-xs font-black text-white sm:text-sm">{jogador.nome}</p>
                        {souEu && <span className="mt-1 rounded-full bg-fuchsia-400/15 px-2 py-0.5 text-[8px] font-black text-fuchsia-200">VOCÊ</span>}
                        <p className="mt-3 text-2xl font-black tabular-nums text-white">{jogador.acertos}<span className="ml-1 text-[10px] font-bold text-white/40">acertos</span></p>
                        <p className="mt-1 text-[9px] font-semibold tabular-nums text-white/40">{formatarTempo(tempoMedio)} médio</p>
                        <div className={`mt-auto w-full rounded-lg bg-gradient-to-r ${config.cor} py-2 text-center text-sm font-black text-[#171426]`}>
                          {jogador.posicao}º lugar
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          <section className="mt-10 overflow-hidden rounded-[1.7rem] border border-white/10 bg-[#121123]/90 shadow-2xl shadow-black/30 backdrop-blur-xl">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.07] px-5 py-5 sm:px-7">
              <div>
                <h2 className="text-base font-black">Classificação geral</h2>
                <p className="mt-1 text-xs text-white/35">{ranking.length} participantes na arena</p>
              </div>
              <span className="rounded-full border border-cyan-300/15 bg-cyan-300/[0.07] px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-cyan-200">Resultado oficial</span>
            </div>

            {demaisJogadores.length > 0 && (
              <div className="space-y-2 p-3 sm:p-5">
                {demaisJogadores.map((jogador) => renderJogador(jogador))}
              </div>
            )}

            {ranking.length === 0 && (
              <div className="px-6 py-14 text-center">
                <Gamepad2 className="mx-auto h-10 w-10 text-white/20" />
                <p className="mt-3 text-sm font-bold text-white/50">Nenhum jogador encontrado.</p>
              </div>
            )}
          </section>

          <div className="mt-8 flex justify-center pb-4">
            <button
              onClick={() => router.push("/")}
              className="group flex cursor-pointer items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.06] px-6 py-3.5 text-sm font-black text-white/80 shadow-lg transition-all duration-300 hover:-translate-y-1 hover:border-fuchsia-300/30 hover:bg-fuchsia-400/10 hover:text-white"
            >
              <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
              Voltar para o início
            </button>
          </div>
        </div>

        <style jsx global>{`
          @keyframes ranking-float {
            0%, 100% { transform: translate3d(0, 0, 0) rotate(0deg); }
            50% { transform: translate3d(12px, -22px, 0) rotate(90deg); }
          }
          @keyframes trophy-bounce {
            0%, 100% { transform: translateY(0) rotate(-3deg); }
            50% { transform: translateY(-8px) rotate(3deg); }
          }
          @keyframes podium-enter {
            from { opacity: 0; transform: translateY(55px) scale(.88); }
            to { opacity: 1; transform: translateY(0) scale(1); }
          }
          @media (prefers-reduced-motion: reduce) {
            *, *::before, *::after {
              animation-duration: .01ms !important;
              animation-iteration-count: 1 !important;
              scroll-behavior: auto !important;
            }
          }
        `}</style>
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
      <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#0b0918] px-4 py-10 text-white">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_45%,rgba(244,63,94,.18),transparent_48%),radial-gradient(ellipse_at_10%_90%,rgba(168,85,247,.13),transparent_35%)]" />
        <div className="pointer-events-none absolute inset-0 opacity-[0.05] [background-image:radial-gradient(#fff_1px,transparent_1px)] [background-size:20px_20px]" />

        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          {Array.from({ length: 22 }, (_, i) => (
            <span
              key={i}
              className="absolute h-3 w-3 animate-[elimination-confetti_1.8s_ease-in_forwards] rounded-[3px]"
              style={{
                left: `${(i * 41) % 100}%`,
                top: `${-10 - (i % 5) * 8}%`,
                backgroundColor: ["#fb7185", "#c084fc", "#67e8f9", "#facc15", "#f9a8d4"][i % 5],
                animationDelay: `${(i % 8) * 90}ms`,
              }}
            />
          ))}
        </div>

        <div className="relative w-full max-w-lg animate-[elimination-card-in_650ms_cubic-bezier(.16,1,.3,1)_both]">
          <div className="absolute -inset-1 rounded-[2.2rem] bg-gradient-to-r from-rose-500/30 via-fuchsia-500/20 to-orange-400/30 opacity-70 blur-xl" />
          <div className="relative overflow-hidden rounded-[2rem] border border-rose-300/20 bg-[#171326]/95 p-7 text-center shadow-2xl shadow-rose-950/30 backdrop-blur-xl sm:p-10">
            <div className="absolute -right-10 -top-10 h-36 w-36 rounded-full bg-rose-500/10 blur-3xl" />
            <div className="absolute -bottom-12 -left-10 h-40 w-40 rounded-full bg-fuchsia-500/10 blur-3xl" />

            <div className="relative mx-auto flex h-28 w-28 animate-[bean-fall_900ms_cubic-bezier(.2,.8,.2,1)_both] items-center justify-center rounded-[2rem] border border-rose-300/25 bg-gradient-to-br from-rose-400/20 to-fuchsia-500/10 shadow-xl shadow-rose-950/30">
              <div className="absolute inset-2 animate-[bean-wobble_1.8s_ease-in-out_infinite] rounded-[1.5rem] border border-white/10" />
              <div className="relative text-6xl drop-shadow-lg">😵</div>
              <span className="absolute -right-3 -top-3 flex h-9 w-9 animate-[trophy-bounce_1.5s_ease-in-out_infinite] items-center justify-center rounded-xl border border-yellow-200/20 bg-yellow-300 text-lg shadow-lg">✦</span>
            </div>

            <span className="mt-7 inline-flex items-center gap-2 rounded-full border border-rose-300/20 bg-rose-400/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.22em] text-rose-200">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-rose-300" />
              Fim da sua corrida
            </span>

            <h1 className="relative mt-4 text-3xl font-black tracking-tight sm:text-4xl">
              <span className="bg-gradient-to-r from-rose-200 via-white to-fuchsia-200 bg-clip-text text-transparent">Você saiu da arena!</span>
            </h1>
            <p className="relative mx-auto mt-3 max-w-sm text-sm leading-6 text-white/50">{mensagemEliminacao}</p>

            <div className="relative mt-7 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] p-4">
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-rose-300/50 to-transparent" />
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/35">Sua jornada ainda conta</p>
              <p className="mt-2 text-sm font-bold text-white/80">Aguarde os outros jogadores terminarem!</p>
              <div className="mt-4 flex items-center justify-center gap-2">
                <span className="h-2 w-2 animate-bounce rounded-full bg-fuchsia-300 [animation-delay:-.3s]" />
                <span className="h-2 w-2 animate-bounce rounded-full bg-cyan-300 [animation-delay:-.15s]" />
                <span className="h-2 w-2 animate-bounce rounded-full bg-yellow-300" />
              </div>
            </div>
            <p className="relative mt-5 text-[10px] font-semibold text-white/25">O resultado final será exibido assim que a partida acabar.</p>
          </div>
        </div>

        <style jsx global>{`
          @keyframes elimination-card-in {
            from { opacity: 0; transform: translateY(28px) scale(.94); }
            to { opacity: 1; transform: translateY(0) scale(1); }
          }
          @keyframes bean-fall {
            0% { opacity: 0; transform: translateY(-100px) rotate(-25deg) scale(.55); }
            65% { opacity: 1; transform: translateY(10px) rotate(8deg) scale(1.08); }
            82% { transform: translateY(-5px) rotate(-5deg) scale(.98); }
            100% { transform: translateY(0) rotate(0) scale(1); }
          }
          @keyframes bean-wobble {
            0%, 100% { transform: rotate(-5deg) scale(1); }
            50% { transform: rotate(5deg) scale(1.04); }
          }
          @keyframes elimination-confetti {
            0% { opacity: 0; transform: translateY(-20px) rotate(0deg); }
            15% { opacity: 1; }
            100% { opacity: 0; transform: translateY(115vh) rotate(620deg); }
          }
          @media (prefers-reduced-motion: reduce) {
            *, *::before, *::after {
              animation-duration: .01ms !important;
              animation-iteration-count: 1 !important;
              scroll-behavior: auto !important;
            }
          }
        `}</style>
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
      classificacaoEliminacao.totalRespostas > 0
        ? classificacaoEliminacao.tempoTotal / classificacaoEliminacao.totalRespostas
        : 0;

    return (
      <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#090817] px-4 py-10 text-white">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_40%,rgba(168,85,247,.19),transparent_48%),radial-gradient(ellipse_at_90%_90%,rgba(34,211,238,.08),transparent_35%)]" />
        <div className="pointer-events-none absolute inset-0 opacity-[0.04] [background-image:radial-gradient(#fff_1px,transparent_1px)] [background-size:22px_22px]" />

        <div className="relative w-full max-w-lg animate-[elimination-card-in_600ms_cubic-bezier(.16,1,.3,1)_both]">
          <div className="overflow-hidden rounded-[2rem] border border-fuchsia-300/20 bg-[#171426]/95 shadow-2xl shadow-fuchsia-950/30 backdrop-blur-xl">
            <div className="relative overflow-hidden border-b border-white/[0.07] bg-gradient-to-r from-fuchsia-500/15 via-violet-500/10 to-cyan-400/10 px-6 pb-7 pt-8 text-center">
              <div className="absolute -left-10 -top-12 h-36 w-36 rounded-full bg-fuchsia-400/15 blur-3xl" />
              <div className="relative mx-auto flex h-20 w-20 animate-[trophy-bounce_2.5s_ease-in-out_infinite] items-center justify-center rounded-[1.6rem] border border-yellow-200/20 bg-gradient-to-br from-yellow-300/20 to-orange-400/10 text-4xl shadow-xl shadow-yellow-950/20">
                🏁
              </div>
              <p className="mt-5 text-[10px] font-black uppercase tracking-[0.24em] text-fuchsia-200/70">Sua colocação na arena</p>
              <h1 className="mt-1 text-6xl font-black tracking-tighter text-white sm:text-7xl">{classificacaoEliminacao.posicao}<span className="text-3xl text-fuchsia-200">º</span></h1>
              <p className="mt-1 text-xs font-semibold text-white/40">de {classificacaoEliminacao.totalJogadores} jogadores</p>
            </div>

            <div className="grid grid-cols-2 gap-3 p-5 sm:p-6">
              <div className="rounded-2xl border border-emerald-300/15 bg-emerald-400/[0.06] p-4">
                <p className="text-[9px] font-black uppercase tracking-[0.18em] text-emerald-200/55">Acertos</p>
                <p className="mt-2 text-3xl font-black tabular-nums text-emerald-200">{classificacaoEliminacao.acertos}</p>
                <p className="mt-1 text-[10px] text-white/30">respostas corretas</p>
              </div>
              <div className="rounded-2xl border border-cyan-300/15 bg-cyan-400/[0.06] p-4">
                <p className="text-[9px] font-black uppercase tracking-[0.18em] text-cyan-200/55">Tempo médio</p>
                <p className="mt-2 text-2xl font-black tabular-nums text-cyan-200">{formatarTempo(tempoMedio)}</p>
                <p className="mt-1 text-[10px] text-white/30">por resposta</p>
              </div>
            </div>

            <div className="px-5 pb-6 sm:px-6">
              <div className="rounded-2xl border border-white/[0.07] bg-white/[0.035] p-4 text-center">
                <p className="text-sm font-black text-white/85">Sua partida continua na torcida!</p>
                <p className="mx-auto mt-1 max-w-sm text-xs leading-5 text-white/40">
                  Sua posição está registrada. Enquanto os outros competem, aguarde o encerramento para conferir o ranking completo.
                </p>
                <div className="mt-4 flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-wider text-fuchsia-200/65">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Aguardando resultado final
                </div>
              </div>

              <button
                onClick={() => router.push("/")}
                className="mt-5 flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.06] px-5 py-3 text-sm font-black text-white/75 transition hover:-translate-y-0.5 hover:border-fuchsia-300/30 hover:bg-fuchsia-400/10 hover:text-white"
              >
                <ArrowLeft className="h-4 w-4" />
                Voltar para o início
              </button>
            </div>
          </div>
        </div>

        <style jsx global>{`
          @keyframes elimination-card-in {
            from { opacity: 0; transform: translateY(28px) scale(.94); }
            to { opacity: 1; transform: translateY(0) scale(1); }
          }
          @keyframes trophy-bounce {
            0%, 100% { transform: translateY(0) rotate(-3deg); }
            50% { transform: translateY(-8px) rotate(3deg); }
          }
          @media (prefers-reduced-motion: reduce) {
            *, *::before, *::after {
              animation-duration: .01ms !important;
              animation-iteration-count: 1 !important;
              scroll-behavior: auto !important;
            }
          }
        `}</style>
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