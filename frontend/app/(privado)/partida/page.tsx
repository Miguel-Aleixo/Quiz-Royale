"use client";

import { useEffect, useState } from "react";
import {
  Clock,
  Users,
  Crown,
  Swords,
  Wifi,
  Trophy,
  Check,
} from "lucide-react";

const pergunta = {
  numero: 3,
  total: 5,
  enunciado: "Qual é a capital do Brasil?",
  alternativas: [
    { id: 1, letra: "A", texto: "São Paulo" },
    { id: 2, letra: "B", texto: "Brasília" },
    { id: 3, letra: "C", texto: "Rio de Janeiro" },
    { id: 4, letra: "D", texto: "Belo Horizonte" },
  ],
};

export default function PartidaPage() {
  const [tempo, setTempo] = useState(20);
  const [selecionada, setSelecionada] = useState<number | null>(null);
  const [respondida, setRespondida] = useState(false);

  useEffect(() => {
    if (tempo <= 0 || respondida) return;

    const intervalo = setInterval(() => {
      setTempo((valor) => valor - 1);
    }, 1000);

    return () => clearInterval(intervalo);
  }, [tempo, respondida]);

  function responder(id: number) {
    if (respondida || tempo <= 0) return;

    setSelecionada(id);
    setRespondida(true);

    console.log("Resposta enviada:", id);

    // Futuramente:
    // socket.emit("responder", {
    //   jogadorId,
    //   alternativaId: id,
    //   tempoResposta: 20 - tempo,
    // });
  }

  const tempoCritico = tempo <= 5;

  return (
    <main className="min-h-screen bg-[#080812] text-white">

      {/* BACKGROUND */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-[-300px] h-[600px] w-[600px] -translate-x-1/2 rounded-full bg-purple-700/15 blur-[150px]" />

        <div className="absolute bottom-[-250px] right-[-200px] h-[500px] w-[500px] rounded-full bg-indigo-700/10 blur-[140px]" />
      </div>

      {/* HEADER */}
      <header className="relative z-10 border-b border-white/5 bg-[#0b0b15]/90 backdrop-blur-xl">
        <div className="mx-auto flex h-20 max-w-6xl items-center justify-between px-6">

          {/* LOGO */}
          <div className="flex items-center gap-3">

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-purple-600 to-indigo-600">
              <Crown size={20} />
            </div>

            <div className="hidden sm:block">
              <h1 className="text-sm font-black">
                QUIZ <span className="text-purple-400">ROYALE</span>
              </h1>

              <p className="text-[9px] uppercase tracking-[0.2em] text-white/20">
                Batalha
              </p>
            </div>
          </div>

          {/* RODADA */}
          <div className="text-center">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/25">
              Rodada
            </p>

            <p className="mt-1 text-sm font-black">
              {pergunta.numero}
              <span className="text-white/20">
                {" "}
                / {pergunta.total}
              </span>
            </p>
          </div>

          {/* JOGADORES */}
          <div className="flex items-center gap-3">

            <div className="hidden items-center gap-2 rounded-xl border border-white/5 bg-white/[0.03] px-4 py-2 sm:flex">
              <Users
                size={15}
                className="text-purple-400"
              />

              <span className="text-xs font-bold">
                24
              </span>

              <span className="text-[10px] text-white/25">
                jogadores
              </span>
            </div>

            <div className="flex items-center gap-2 rounded-xl border border-emerald-500/10 bg-emerald-500/5 px-3 py-2">
              <Wifi
                size={13}
                className="text-emerald-400"
              />

              <span className="text-[10px] font-bold text-emerald-400">
                ONLINE
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* CONTEÚDO */}
      <section className="relative z-10 mx-auto max-w-5xl px-5 py-8 sm:px-6 sm:py-12">

        {/* STATUS */}
        <div className="mb-8 flex items-center justify-between">

          <div className="flex items-center gap-2">
            <Swords
              size={16}
              className="text-purple-400"
            />

            <span className="text-xs font-bold uppercase tracking-wider text-white/30">
              Batalha em andamento
            </span>
          </div>

          <div className="text-xs text-white/25">
            Tema:{" "}
            <span className="font-bold text-white/50">
              Conhecimentos Gerais
            </span>
          </div>

        </div>

        {/* TIMER */}
        <div className="mb-8 flex justify-center">

          <div
            className={`
              relative flex h-28 w-28
              items-center justify-center
              rounded-full border-4
              ${
                tempoCritico
                  ? "border-red-500/60 bg-red-500/5"
                  : "border-purple-500/30 bg-purple-500/5"
              }
            `}
          >

            <div className="text-center">

              <Clock
                size={17}
                className={`mx-auto mb-1 ${
                  tempoCritico
                    ? "text-red-400"
                    : "text-purple-400"
                }`}
              />

              <span
                className={`text-3xl font-black ${
                  tempoCritico
                    ? "text-red-400"
                    : "text-white"
                }`}
              >
                {tempo}
              </span>

            </div>
          </div>
        </div>

        {/* PERGUNTA */}
        <div className="mb-8 text-center">

          <span className="inline-flex items-center gap-2 rounded-full border border-purple-500/10 bg-purple-500/5 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-purple-400">
            <Trophy size={12} />
            Pergunta {pergunta.numero}
          </span>

          <h2 className="mx-auto mt-6 max-w-3xl text-2xl font-black leading-tight sm:text-4xl">
            {pergunta.enunciado}
          </h2>

        </div>

        {/* ALTERNATIVAS */}
        <div className="grid gap-4 md:grid-cols-2">

          {pergunta.alternativas.map((alternativa) => {

            const selecionadaAtual =
              selecionada === alternativa.id;

            return (
              <button
                key={alternativa.id}
                onClick={() => responder(alternativa.id)}
                disabled={respondida || tempo <= 0}
                className={`
                  group relative min-h-[110px]
                  rounded-2xl border
                  p-5 text-left
                  transition-all duration-200

                  ${
                    selecionadaAtual
                      ? "border-purple-500 bg-purple-500/10 shadow-lg shadow-purple-900/20"
                      : "border-white/10 bg-white/[0.025] hover:border-purple-500/30 hover:bg-purple-500/[0.04]"
                  }

                  ${
                    respondida && !selecionadaAtual
                      ? "opacity-50"
                      : ""
                  }
                `}
              >

                <div className="flex items-center gap-5">

                  {/* LETRA */}
                  <div
                    className={`
                      flex h-12 w-12 shrink-0
                      items-center justify-center
                      rounded-xl border
                      text-sm font-black

                      ${
                        selecionadaAtual
                          ? "border-purple-400 bg-purple-500 text-white"
                          : "border-white/10 bg-white/[0.03] text-white/40 group-hover:border-purple-500/30 group-hover:text-purple-400"
                      }
                    `}
                  >
                    {selecionadaAtual ? (
                      <Check size={19} />
                    ) : (
                      alternativa.letra
                    )}
                  </div>

                  {/* TEXTO */}
                  <span
                    className={`
                      text-base font-bold sm:text-lg
                      ${
                        selecionadaAtual
                          ? "text-white"
                          : "text-white/65"
                      }
                    `}
                  >
                    {alternativa.texto}
                  </span>

                </div>
              </button>
            );
          })}
        </div>

        {/* RODAPÉ DA PARTIDA */}
        <div className="mt-8 flex flex-col items-center justify-between gap-4 rounded-2xl border border-white/5 bg-white/[0.02] px-5 py-4 sm:flex-row">

          <div className="flex items-center gap-3">

            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-500/10">
              <Users
                size={16}
                className="text-purple-400"
              />
            </div>

            <div>
              <p className="text-xs font-bold">
                Sua posição
              </p>

              <p className="text-[11px] text-white/25">
                Você está entre os melhores
              </p>
            </div>

          </div>

          <div className="flex items-center gap-2">

            <span className="text-xs text-white/30">
              Posição
            </span>

            <span className="text-lg font-black text-purple-400">
              #8
            </span>

          </div>

        </div>

        {/* AVISO */}
        {!respondida && tempo > 0 && (
          <p className="mt-5 text-center text-[11px] text-white/20">
            Escolha uma alternativa antes que o tempo acabe.
          </p>
        )}

        {respondida && (
          <div className="mt-5 flex items-center justify-center gap-2 text-xs font-bold text-purple-400">
            <Check size={15} />
            Resposta enviada. Aguarde o resultado.
          </div>
        )}

        {tempo <= 0 && !respondida && (
          <div className="mt-5 text-center text-xs font-bold text-red-400">
            Tempo esgotado.
          </div>
        )}

      </section>
    </main>
  );
}

