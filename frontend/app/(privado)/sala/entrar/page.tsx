
"use client";

import { Suspense, useEffect, useRef, useState } from "react";
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
  MessageCircle,
  Play,
  Send,
  Users,
  WifiOff,
  ShieldCheck,
  Clock3,
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

interface SalaAtualizada extends Sala { }

interface ErroSocket {
  mensagem: string;
}

interface SalaFechada {
  codigo: string;
  mensagem: string;
}

interface MensagemChat {
  id: string;
  usuarioId: number;
  nome: string;
  texto: string;
  criadoEm: string;
}

const LIMITE_CARACTERES = 300;
const INTERVALO_MENSAGENS_MS = 2000;

function SalaEntrarContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const codigoParam = searchParams.get("codigo");
  const API = process.env.NEXT_PUBLIC_API;
  const usuario = useToken();

  const [sala, setSala] = useState<Sala | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [conectado, setConectado] = useState(false);
  const [copiado, setCopiado] = useState(false);
  const [saindo, setSaindo] = useState(false);
  const [iniciando, setIniciando] = useState(false);
  const [modalSair, setModalSair] = useState(false);
  const [mensagensChat, setMensagensChat] = useState<MensagemChat[]>([]);
  const [textoChat, setTextoChat] = useState("");
  const [cooldown, setCooldown] = useState(0);

  const audioContextRef = useRef<AudioContext | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const mensagensRef = useRef<HTMLDivElement | null>(null);
  const proximoEnvioRef = useRef(0);
  const cooldownTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  function tocarSom(tipo: "conectado" | "copiado" | "inicio" | "erro") {
    if (typeof window === "undefined") return;

    try {
      const AudioContextClass = window.AudioContext;
      if (!AudioContextClass) return;

      const context = audioContextRef.current ?? new AudioContextClass();
      audioContextRef.current = context;

      if (context.state === "suspended") void context.resume();

      const notas = {
        conectado: [392, 523],
        copiado: [659, 784],
        inicio: [523, 659, 784, 1047],
        erro: [330, 262],
      }[tipo];

      const agora = context.currentTime;

      notas.forEach((frequencia, index) => {
        const inicio = agora + index * 0.1;
        const oscilador = context.createOscillator();
        const ganho = context.createGain();

        oscilador.type = tipo === "erro" ? "sawtooth" : "sine";
        oscilador.frequency.value = frequencia;
        ganho.gain.setValueAtTime(0.0001, inicio);
        ganho.gain.exponentialRampToValueAtTime(0.06, inicio + 0.015);
        ganho.gain.exponentialRampToValueAtTime(0.0001, inicio + 0.18);

        oscilador.connect(ganho);
        ganho.connect(context.destination);
        oscilador.start(inicio);
        oscilador.stop(inicio + 0.2);
      });
    } catch {
      // O áudio é opcional; falhas não devem interromper a sala.
    }
  }

  /*
   * CONTAGEM REGRESSIVA DO CHAT
   */
  useEffect(() => {
    cooldownTimerRef.current = setInterval(() => {
      const restante = Math.max(
        0,
        Math.ceil((proximoEnvioRef.current - Date.now()) / 1000)
      );

      setCooldown(restante);
    }, 150);

    return () => {
      if (cooldownTimerRef.current) {
        clearInterval(cooldownTimerRef.current);
      }
    };
  }, []);

  /*
   * BUSCAR SALA
   */
  useEffect(() => {
    let cancelado = false;

    async function buscarSala() {
      if (!codigoParam) {
        setErro("Código da sala não informado.");
        setCarregando(false);
        return;
      }

      const token = Cookies.get("token");

      if (!token) {
        router.push("/login");
        return;
      }

      if (!API) {
        setErro("API não configurada.");
        setCarregando(false);
        return;
      }

      try {
        setCarregando(true);
        setErro("");

        const res = await fetch(`${API}/sala/codigo/${codigoParam}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await res.json();

        if (!res.ok) {
          const mensagem = Array.isArray(data?.message)
            ? data.message.join(", ")
            : data?.message || "Erro ao buscar sala.";

          throw new Error(mensagem);
        }

        if (!cancelado) setSala(data);
      } catch (error) {
        const mensagem =
          error instanceof Error ? error.message : "Erro ao carregar a sala.";

        if (!cancelado) {
          setErro(mensagem);
          toast.error(mensagem);
        }
      } finally {
        if (!cancelado) setCarregando(false);
      }
    }

    void buscarSala();

    return () => {
      cancelado = true;
    };
  }, [API, codigoParam, router]);

  /*
   * SOCKET.IO
   */
  useEffect(() => {
    if (!codigoParam || !API) return;

    const token = Cookies.get("token");

    if (!token) {
      router.push("/login");
      return;
    }

    const socketInstance: Socket = io(API, {
      auth: { token },
    });

    socketRef.current = socketInstance;

    socketInstance.on("historico_chat", (mensagens: MensagemChat[]) => {
      setMensagensChat(Array.isArray(mensagens) ? mensagens.slice(-100) : []);
    });

    socketInstance.on("nova_mensagem", (mensagem: MensagemChat) => {
      setMensagensChat((anteriores) => {
        if (anteriores.some((item) => item.id === mensagem.id)) {
          return anteriores;
        }

        return [...anteriores, mensagem].slice(-100);
      });
    });

    socketInstance.on("erro_chat", (data: ErroSocket) => {
      toast.error(data?.mensagem || "Não foi possível enviar a mensagem.");
    });

    socketInstance.on("connect", () => {
      console.log("Conectado ao SalaGateway:", socketInstance.id);
      setConectado(true);
      tocarSom("conectado");

      socketInstance.emit("entrar_sala", {
        codigo: codigoParam,
      });
    });

    socketInstance.on("sala_atualizada", (data: SalaAtualizada) => {
      setSala(data);
    });

    socketInstance.on("sala_fechada", (data: SalaFechada) => {
      setConectado(false);

      toast.info(data.mensagem || "O criador saiu. A sala foi fechada.");

      setTimeout(() => router.push("/"), 800);
    });

    socketInstance.on("partida_iniciada", (data: { codigo: string }) => {
      toast.success("A partida começou!");
      tocarSom("inicio");

      setTimeout(() => {
        router.push(`/sala/partida?codigo=${data.codigo}`);
      }, 500);
    });

    socketInstance.on("erro_sala", (data: ErroSocket) => {
      setErro(data.mensagem);
      toast.error(data.mensagem);
      tocarSom("erro");
    });

    socketInstance.on("connect_error", (error) => {
      console.error("Erro ao conectar Socket.IO:", error.message);
      setConectado(false);
    });

    socketInstance.on("disconnect", (reason) => {
      console.log("Desconectado:", reason);
      setConectado(false);
    });

    return () => {
      socketInstance.disconnect();

      if (socketRef.current === socketInstance) {
        socketRef.current = null;
      }
    };
  }, [API, codigoParam, router]);

  /*
   * ROLAR CHAT PARA A ÚLTIMA MENSAGEM
   */
  useEffect(() => {
    const elemento = mensagensRef.current;

    if (elemento) {
      elemento.scrollTo({
        top: elemento.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [mensagensChat]);

  /*
   * ENVIAR MENSAGEM COM INTERVALO MÍNIMO
   */
  function enviarMensagemChat(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    const texto = textoChat.trim();
    const socketAtual = socketRef.current;

    if (!texto) return;

    if (texto.length > LIMITE_CARACTERES) {
      toast.error(`A mensagem deve ter no máximo ${LIMITE_CARACTERES} caracteres.`);
      return;
    }

    if (!sala?.codigo) {
      toast.error("Sala não encontrada.");
      return;
    }

    if (!socketAtual?.connected || !conectado) {
      toast.error("Você está desconectado da sala.");
      return;
    }

    const agora = Date.now();

    // A validação por ref evita envios repetidos antes da atualização do estado.
    if (agora < proximoEnvioRef.current) {
      const restante = Math.ceil((proximoEnvioRef.current - agora) / 1000);
      setCooldown(restante);
      toast.warning(`Aguarde ${restante} segundo${restante === 1 ? "" : "s"} para enviar outra mensagem.`);
      return;
    }

    proximoEnvioRef.current = agora + INTERVALO_MENSAGENS_MS;
    setCooldown(Math.ceil(INTERVALO_MENSAGENS_MS / 1000));

    socketAtual.emit("enviar_mensagem", {
      codigo: sala.codigo,
      texto,
    });

    setTextoChat("");
  }

  /*
   * COPIAR CÓDIGO
   */
  async function copiarCodigo() {
    if (!sala?.codigo) return;

    try {
      await navigator.clipboard.writeText(sala.codigo);
      setCopiado(true);
      tocarSom("copiado");
      toast.success("Código copiado!");

      setTimeout(() => setCopiado(false), 2000);
    } catch {
      tocarSom("erro");
      toast.error("Não foi possível copiar o código.");
    }
  }

  /*
   * SAIR DA SALA
   */
  async function sairDaSala() {
    if (!sala) return;

    const token = Cookies.get("token");

    if (!token) {
      router.push("/login");
      return;
    }

    if (!API) {
      toast.error("API não configurada.");
      return;
    }

    try {
      setSaindo(true);
      setErro("");

      const res = await fetch(
        `${API}/sala/sair/${encodeURIComponent(sala.codigo)}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await res.json();

      if (!res.ok) {
        const mensagem = Array.isArray(data?.message)
          ? data.message.join(", ")
          : data?.message || "Não foi possível sair da sala.";

        throw new Error(mensagem);
      }

      toast.success("Você saiu da sala.");
      setModalSair(false);
      router.push("/");
    } catch (error) {
      const mensagem =
        error instanceof Error ? error.message : "Erro ao sair da sala.";

      setErro(mensagem);
      toast.error(mensagem);
    } finally {
      setSaindo(false);
    }
  }

  /*
   * INICIAR PARTIDA
   */
  async function iniciarPartida() {
    if (!sala?.codigo) return;

    const token = Cookies.get("token");

    if (!token) {
      router.push("/login");
      return;
    }

    if (!API) {
      toast.error("API não configurada.");
      return;
    }

    try {
      setIniciando(true);
      setErro("");

      const res = await fetch(`${API}/partida/iniciar/${sala.codigo}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      if (!res.ok) {
        const mensagem = Array.isArray(data?.message)
          ? data.message.join(", ")
          : data?.message || "Não foi possível iniciar a partida.";

        throw new Error(mensagem);
      }

      console.log("Partida iniciada:", data);
      toast.success("Partida iniciada!");
    } catch (error) {
      const mensagem =
        error instanceof Error ? error.message : "Erro ao iniciar partida.";

      setErro(mensagem);
      toast.error(mensagem);
      tocarSom("erro");
    } finally {
      setIniciando(false);
    }
  }

  /*
   * LOADING
   */
  if (carregando) {
    return (
      <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#070711] text-white">
        <div className="pointer-events-none absolute -left-40 -top-40 h-96 w-96 rounded-full bg-fuchsia-600/15 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-cyan-600/10 blur-3xl" />

        <div className="relative flex flex-col items-center gap-5">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-fuchsia-400/20 bg-fuchsia-500/10 shadow-xl shadow-fuchsia-950/30">
            <Loader2 className="h-8 w-8 animate-spin text-fuchsia-300" />
          </div>

          <div className="text-center">
            <p className="font-bold">Entrando na sala...</p>
            <p className="mt-1 text-sm text-white/40">Aguarde um momento</p>
          </div>
        </div>
      </main>
    );
  }

  /*
   * ERRO SEM SALA
   */
  if (erro && !sala) {
    return (
      <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#070711] px-6 text-white">
        <div className="pointer-events-none absolute left-1/2 top-0 h-96 w-96 -translate-x-1/2 rounded-full bg-red-600/10 blur-3xl" />

        <div className="relative w-full max-w-md rounded-3xl border border-red-400/15 bg-white/[0.035] p-8 text-center shadow-2xl shadow-black/20">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-red-400/10 bg-red-500/10">
            <WifiOff className="h-8 w-8 text-red-400" />
          </div>

          <h1 className="mt-6 text-xl font-black">Não foi possível entrar</h1>

          <p className="mt-3 text-sm leading-6 text-white/45">{erro}</p>

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

  if (!sala) return null;

  const ehCriador = Number(usuario?.sub) === Number(sala.criador?.id);
  const quantidadeJogadores = sala.jogadores?.length ?? 0;
  const percentualSala =
    sala.maxJogadores > 0
      ? Math.min((quantidadeJogadores / sala.maxJogadores) * 100, 100)
      : 0;

  const podeEnviar =
    Boolean(textoChat.trim()) &&
    conectado &&
    cooldown === 0 &&
    textoChat.trim().length <= LIMITE_CARACTERES;

  /*
   * TELA PRINCIPAL
   */
  return (
    <main className="relative min-h-screen overflow-x-hidden bg-[#070711] text-white selection:bg-fuchsia-400/20">
      {/* BACKGROUND */}
      <div className="pointer-events-none fixed -left-40 -top-40 h-[500px] w-[500px] rounded-full bg-fuchsia-600/12 blur-3xl" />
      <div className="pointer-events-none fixed -bottom-60 -right-40 h-[500px] w-[500px] rounded-full bg-cyan-600/10 blur-3xl" />
      <div className="pointer-events-none fixed inset-0 opacity-[0.025] [background-image:linear-gradient(rgba(255,255,255,.8)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.8)_1px,transparent_1px)] [background-size:44px_44px]" />

      <div className="relative mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 py-4 sm:px-6 lg:px-8">
        {/* HEADER */}
        <header className="flex items-center justify-between gap-3 rounded-2xl border border-white/[0.08] bg-[#10101d]/80 px-4 py-3 shadow-lg shadow-black/10 backdrop-blur-xl md:px-5">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-fuchsia-300/25 bg-gradient-to-br from-fuchsia-500/20 to-violet-500/10 shadow-lg shadow-fuchsia-950/20">
              <Gamepad2 className="h-5 w-5 text-fuchsia-200" />
            </div>

            <div className="min-w-0">
              <h1 className="text-sm font-black tracking-wide">
                QUIZ <span className="text-fuchsia-300">ROYALE</span>
              </h1>
              <p className="text-[11px] font-medium text-white/35">
                Lobby da partida
              </p>
            </div>
          </div>

          <div
            className={`flex shrink-0 items-center gap-2 rounded-full border px-3 py-2 ${conectado
                ? "border-emerald-400/15 bg-emerald-500/10 text-emerald-300"
                : "border-yellow-400/15 bg-yellow-500/10 text-yellow-300"
              }`}
          >
            <span
              className={`h-2 w-2 rounded-full ${conectado
                  ? "bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,.7)]"
                  : "animate-pulse bg-yellow-400"
                }`}
            />
            <span className="hidden text-[11px] font-bold sm:block">
              {conectado ? "Conectado" : "Conectando..."}
            </span>
          </div>
        </header>

        {erro && sala && (
          <div className="mt-4 rounded-xl border border-red-400/15 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {erro}
          </div>
        )}

        {/* CONTEÚDO */}
        <div className="mt-5 grid flex-1 items-start gap-5 lg:grid-cols-[minmax(0,1fr)_350px]">
          {/* CARD PRINCIPAL */}
          <section className="min-w-0 overflow-hidden rounded-3xl border border-white/[0.09] bg-[#10101d]/75 p-4 shadow-xl shadow-black/10 backdrop-blur-xl sm:p-6">
            <div className="flex flex-col items-center text-center">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-fuchsia-400/20 bg-fuchsia-500/10 px-3 py-1.5">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-fuchsia-300 shadow-[0_0_12px_rgba(232,121,249,.9)]" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-fuchsia-200">
                  Sala de espera
                </span>
              </div>

              <h2 className="max-w-full break-words text-2xl font-black tracking-tight sm:text-3xl md:text-4xl">
                {sala.nome}
              </h2>

              <p className="mt-2 max-w-md text-sm leading-6 text-white/40">
                Convide seus amigos e prepare-se para competir.
              </p>
            </div>

            {/* CÓDIGO */}
            <div className="mx-auto mt-6 max-w-lg">
              <p className="mb-2 text-center text-[10px] font-black uppercase tracking-[0.2em] text-white/35">
                Código da sala
              </p>

              <button
                type="button"
                onClick={copiarCodigo}
                className="group relative flex w-full items-center justify-center overflow-hidden rounded-2xl border border-fuchsia-400/25 bg-gradient-to-br from-fuchsia-500/[0.09] to-violet-500/[0.04] px-5 py-4 transition duration-200 hover:-translate-y-0.5 hover:border-fuchsia-300/50 hover:shadow-lg hover:shadow-fuchsia-950/20"
              >
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.04] to-transparent opacity-0 transition group-hover:opacity-100" />

                <span className="relative break-all font-mono text-3xl font-black tracking-[0.2em] text-fuchsia-100 sm:text-4xl sm:tracking-[0.3em]">
                  {sala.codigo}
                </span>

                <span className="absolute right-3 flex h-9 w-9 items-center justify-center rounded-xl border border-white/[0.06] bg-white/[0.05] sm:right-4">
                  {copiado ? (
                    <Check className="h-4 w-4 text-emerald-400" />
                  ) : (
                    <Copy className="h-4 w-4 text-white/40 transition group-hover:text-fuchsia-200" />
                  )}
                </span>
              </button>

              <p className="mt-2 text-center text-[11px] text-white/30">
                Clique no código para copiar e compartilhar
              </p>
            </div>

            {/* JOGADORES */}
            <div className="mt-6 rounded-2xl border border-white/[0.08] bg-black/10 p-4 sm:p-5">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-fuchsia-300/10 bg-fuchsia-500/10">
                    <Users className="h-5 w-5 text-fuchsia-300" />
                  </div>

                  <div>
                    <p className="text-sm font-black">Jogadores</p>
                    <p className="mt-0.5 text-[11px] text-white/35">
                      Participantes na sala
                    </p>
                  </div>
                </div>

                <p className="shrink-0 text-xl font-black tabular-nums">
                  {quantidadeJogadores}
                  <span className="text-sm font-semibold text-white/30">
                    {" "}/ {sala.maxJogadores}
                  </span>
                </p>
              </div>

              <div
                className="mt-4 h-2 overflow-hidden rounded-full bg-white/[0.06]"
                role="progressbar"
                aria-label="Ocupação da sala"
                aria-valuenow={quantidadeJogadores}
                aria-valuemin={0}
                aria-valuemax={sala.maxJogadores}
              >
                <div
                  className="h-full rounded-full bg-gradient-to-r from-fuchsia-500 via-purple-500 to-violet-400 transition-all duration-500"
                  style={{ width: `${percentualSala}%` }}
                />
              </div>

              <p className="mt-2 text-right text-[10px] text-white/30">
                {Math.max(sala.maxJogadores - quantidadeJogadores, 0)} vaga(s)
                disponível(is)
              </p>
            </div>

            {/* LISTA DE JOGADORES */}
            <div className="mt-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <h3 className="text-xs font-black uppercase tracking-[0.15em] text-white/50">
                  Participantes
                </h3>
                <span className="rounded-full border border-white/[0.08] bg-white/[0.03] px-2.5 py-1 text-[10px] font-bold text-white/45">
                  {quantidadeJogadores} online na sala
                </span>
              </div>

              {quantidadeJogadores > 0 ? (
                <div className="grid gap-2 sm:grid-cols-2">
                  {sala.jogadores.map((jogador) => {
                    const ehJogadorCriador =
                      Number(jogador.usuarioId) === Number(sala.criador?.id);

                    return (
                      <div
                        key={jogador.id}
                        className="group flex min-w-0 items-center gap-3 rounded-2xl border border-white/[0.07] bg-white/[0.025] p-3 transition hover:border-fuchsia-400/20 hover:bg-white/[0.045]"
                      >
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-fuchsia-500/25 to-violet-500/10 text-sm font-black text-fuchsia-200 ring-1 ring-fuchsia-300/15">
                          {jogador.usuario.nome.charAt(0).toUpperCase()}
                        </div>

                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-bold">
                            {jogador.usuario.nome}
                          </p>

                          {ehJogadorCriador ? (
                            <div className="mt-1 flex items-center gap-1 text-[9px] font-black uppercase tracking-wider text-yellow-300">
                              <Crown className="h-3 w-3" />
                              Criador da sala
                            </div>
                          ) : (
                            <p className="mt-1 text-[10px] text-white/30">
                              Participante
                            </p>
                          )}
                        </div>

                        {ehJogadorCriador && (
                          <ShieldCheck className="h-4 w-4 shrink-0 text-yellow-300/60" />
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-white/10 px-5 py-9 text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-white/[0.04]">
                    <Users className="h-5 w-5 text-white/25" />
                  </div>
                  <p className="mt-3 text-sm font-bold text-white/55">
                    Aguardando jogadores
                  </p>
                  <p className="mt-1 text-xs text-white/30">
                    Compartilhe o código para reunir sua equipe.
                  </p>
                </div>
              )}
            </div>
          </section>

          {/* SIDEBAR */}
          <aside className="flex min-w-0 flex-col gap-4">
            {/* STATUS */}
            <div className="rounded-2xl border border-white/[0.08] bg-[#10101d]/75 p-4 shadow-lg shadow-black/10 backdrop-blur-xl sm:p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-emerald-400/10 bg-emerald-500/10">
                  <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,.6)]" />
                </div>

                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.15em] text-white/35">
                    Status da sala
                  </p>
                  <p className="mt-1 text-sm font-black text-emerald-300">
                    Aguardando início
                  </p>
                </div>
              </div>

              <p className="mt-4 border-t border-white/[0.06] pt-4 text-xs leading-6 text-white/45">
                {ehCriador
                  ? "Você é o criador. Quando todos estiverem prontos, poderá iniciar a partida."
                  : "Aguarde o criador iniciar a partida. Você será direcionado automaticamente."}
              </p>
            </div>

            {/* CHAT */}
            <section className="flex min-h-[100px] flex-col overflow-hidden rounded-2xl border border-fuchsia-400/15 bg-[#10101d]/90 shadow-xl shadow-black/10 backdrop-blur-xl sm:min-h-[460px] lg:sticky lg:top-4">
              <div className="flex items-center gap-3 border-b border-white/[0.07] px-4 py-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-fuchsia-300/10 bg-fuchsia-500/10">
                  <MessageCircle className="h-5 w-5 text-fuchsia-300" />
                </div>

                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-black">Chat da sala</h3>
                  <p className="mt-0.5 text-[11px] text-white/35">
                    Converse com os participantes
                  </p>
                </div>

                <span
                  className={`h-2 w-2 shrink-0 rounded-full ${conectado ? "bg-emerald-400" : "bg-yellow-400"
                    }`}
                  title={conectado ? "Conectado" : "Desconectado"}
                />
              </div>

              <div
                ref={mensagensRef}
                aria-live="polite"
                aria-label="Mensagens do chat"
                className="flex max-h-[420px] min-h-[240px] flex-1 flex-col gap-3 overflow-y-auto overscroll-contain p-4 [scrollbar-color:rgba(192,132,252,.25)_transparent] [scrollbar-width:thin]"
              >
                {mensagensChat.length === 0 ? (
                  <div className="flex flex-1 flex-col items-center justify-center py-8 text-center">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/[0.06] bg-white/[0.03]">
                      <MessageCircle className="h-6 w-6 text-white/20" />
                    </div>
                    <p className="mt-3 text-sm font-bold text-white/50">
                      Nenhuma mensagem ainda
                    </p>
                    <p className="mt-1 max-w-[210px] text-xs leading-5 text-white/30">
                      Comece a conversa com os participantes da sala.
                    </p>
                  </div>
                ) : (
                  mensagensChat.map((mensagem) => {
                    const minhaMensagem =
                      Number(mensagem.usuarioId) === Number(usuario?.sub);

                    return (
                      <div
                        key={mensagem.id}
                        className={`flex min-w-0 flex-col ${minhaMensagem ? "items-end" : "items-start"
                          }`}
                      >
                        <span className="mb-1 max-w-[90%] truncate px-1 text-[10px] font-bold text-white/40">
                          {minhaMensagem ? "Você" : mensagem.nome}
                        </span>

                        <div
                          className={`max-w-[90%] break-words rounded-2xl px-3 py-2.5 text-sm leading-5 ${minhaMensagem
                              ? "rounded-br-sm bg-gradient-to-br from-fuchsia-600 to-violet-600 text-white shadow-md shadow-fuchsia-950/20"
                              : "rounded-bl-sm border border-white/[0.07] bg-white/[0.045] text-white/85"
                            }`}
                        >
                          {mensagem.texto}
                        </div>

                        <span className="mt-1 px-1 text-[9px] text-white/25">
                          {new Date(mensagem.criadoEm).toLocaleTimeString(
                            "pt-BR",
                            { hour: "2-digit", minute: "2-digit" }
                          )}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>

              {/* FORMULÁRIO DO CHAT */}
              <form
                onSubmit={enviarMensagemChat}
                className="border-t border-white/[0.07] bg-black/10 p-3"
              >
                <div
                  className={`flex items-center gap-2 rounded-xl border bg-black/20 p-1.5 transition ${cooldown > 0
                      ? "border-yellow-400/20"
                      : "border-white/10 focus-within:border-fuchsia-400/40"
                    }`}
                >
                  <input
                    value={textoChat}
                    onChange={(event) =>
                      setTextoChat(
                        event.target.value.slice(0, LIMITE_CARACTERES)
                      )
                    }
                    maxLength={LIMITE_CARACTERES}
                    placeholder={
                      !conectado
                        ? "Conectando ao chat..."
                        : cooldown > 0
                          ? "Aguarde para enviar..."
                          : "Digite uma mensagem..."
                    }
                    aria-label="Mensagem do chat"
                    disabled={!conectado}
                    className="min-w-0 flex-1 bg-transparent px-2 py-2 text-sm text-white outline-none placeholder:text-white/25 disabled:opacity-50"
                  />

                  <button
                    type="submit"
                    disabled={!podeEnviar}
                    aria-label="Enviar mensagem"
                    title={
                      cooldown > 0
                        ? `Aguarde ${cooldown}s`
                        : "Enviar mensagem"
                    }
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-fuchsia-600 to-violet-600 text-white shadow-md shadow-fuchsia-950/20 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-30"
                  >
                    {cooldown > 0 ? (
                      <span className="text-xs font-black tabular-nums">
                        {cooldown}
                      </span>
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </button>
                </div>

                <div className="mt-2 flex items-center justify-between gap-2 px-1">
                  <p
                    className={`text-[10px] ${textoChat.length >= LIMITE_CARACTERES
                        ? "text-yellow-300"
                        : "text-white/30"
                      }`}
                  >
                    {textoChat.length}/{LIMITE_CARACTERES} caracteres
                  </p>

                  {cooldown > 0 ? (
                    <span className="flex items-center gap-1 text-[10px] font-medium text-yellow-300/80">
                      <Clock3 className="h-3 w-3" />
                      Aguarde {cooldown}s
                    </span>
                  ) : (
                    <span className="text-[10px] text-white/25">
                      1 mensagem a cada 2s
                    </span>
                  )}
                </div>
              </form>
            </section>

            {/* INICIAR PARTIDA */}
            {ehCriador && (
              <button
                type="button"
                onClick={iniciarPartida}
                disabled={iniciando || quantidadeJogadores === 0}
                className="group flex w-full cursor-pointer items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-fuchsia-600 to-violet-600 px-5 py-4 text-sm font-black shadow-lg shadow-fuchsia-950/25 transition hover:-translate-y-0.5 hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0"
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
            <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] px-4 py-3">
              <p className="text-center text-[11px] leading-5 text-white/35">
                A partida começará para todos os jogadores simultaneamente.
              </p>
            </div>

            {/* SAIR */}
            <button
              type="button"
              onClick={() => setModalSair(true)}
              disabled={saindo}
              className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.02] px-5 py-3.5 text-xs font-bold text-white/45 transition hover:border-red-400/20 hover:bg-red-500/[0.06] hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <LogOut className="h-4 w-4" />
              Sair da sala
            </button>
          </aside>
        </div>

        {/* RODAPÉ */}
        <footer className="mt-8 border-t border-white/[0.07] py-6">
          <div className="flex flex-col items-center justify-center gap-2 text-center sm:flex-row sm:gap-3">
            <p className="text-[11px] leading-5 text-white/30">
              © {new Date().getFullYear()} QuizRoyale. Todos os direitos reservados.
            </p>
          </div>
        </footer>
      </div>

      {/* MODAL SAIR DA SALA */}
      {modalSair && (
        <div
          className="fixed inset-0 z-50 flex animate-[lobby-fade-in_180ms_ease-out] items-center justify-center bg-black/75 px-4 py-6 backdrop-blur-md"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !saindo) {
              setModalSair(false);
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-sair-titulo"
            className="w-full max-w-md animate-[lobby-modal-in_260ms_cubic-bezier(.22,1,.36,1)] overflow-hidden rounded-3xl border border-white/10 bg-[#11111f] shadow-2xl shadow-black/50"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="border-b border-white/[0.06] px-6 py-5">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-red-400/10 bg-red-500/10">
                  <LogOut className="h-5 w-5 text-red-400" />
                </div>

                <div>
                  <h2 id="modal-sair-titulo" className="text-base font-black">
                    Sair da sala?
                  </h2>
                  <p className="mt-1 text-xs text-white/35">
                    Essa ação precisa de confirmação
                  </p>
                </div>
              </div>
            </div>

            <div className="px-6 py-6">
              <div className="rounded-2xl border border-red-400/10 bg-red-500/[0.05] p-4">
                <div className="flex gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-500/10">
                    <span className="text-sm font-black text-red-400">!</span>
                  </div>

                  <div>
                    <p className="text-sm font-bold text-red-300">Atenção</p>
                    <p className="mt-1 text-xs leading-5 text-white/50">
                      Ao sair da sala, ela será fechada para todos os jogadores
                      que estão aguardando.
                    </p>
                  </div>
                </div>
              </div>

              <p className="mt-5 text-sm leading-6 text-white/55">
                Tem certeza de que deseja sair da sala{" "}
                <span className="font-bold text-white">{sala.nome}</span>?
              </p>
            </div>

            <div className="flex gap-3 border-t border-white/[0.06] px-6 py-5">
              <button
                type="button"
                onClick={() => setModalSair(false)}
                disabled={saindo}
                className="flex-1 cursor-pointer rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm font-bold text-white/60 transition hover:bg-white/[0.06] hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={sairDaSala}
                disabled={saindo}
                className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-3 text-sm font-black text-white transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-50"
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

      <style jsx global>{`
        @keyframes lobby-fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes lobby-modal-in {
          from {
            opacity: 0;
            transform: translateY(12px) scale(0.97);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>
    </main>
  );
}

export default function Page() {
  return (
    <Suspense
      fallback={
        <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#070711] text-white">
          <div className="pointer-events-none absolute -left-40 -top-40 h-96 w-96 rounded-full bg-fuchsia-600/15 blur-3xl" />
          <div className="relative flex flex-col items-center gap-5">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-fuchsia-400/20 bg-fuchsia-500/10">
              <Loader2 className="h-8 w-8 animate-spin text-fuchsia-300" />
            </div>
            <p className="text-sm font-bold text-white/50">Carregando sala...</p>
          </div>
        </main>
      }
    >
      <SalaEntrarContent />
    </Suspense>
  );
}
