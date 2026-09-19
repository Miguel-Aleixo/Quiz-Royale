"use client";

import { Volume2, VolumeX } from "lucide-react";
import { useEffect, useRef, useState } from "react";

type MusicRefs = {
  context: AudioContext;
  master: GainNode;
  timer: number | null;
  step: number;
};

export default function BackgroundMusic() {
  const [ativo, setAtivo] = useState(false);
  const musicRef = useRef<MusicRefs | null>(null);

  const bpm = 92;
  const stepDuration = (60 / bpm) * 1000;

  const acordes = [
    [261.63, 329.63, 392.0], // C
    [220.0, 261.63, 329.63], // Am
    [174.61, 220.0, 261.63], // F
    [196.0, 246.94, 293.66], // G
  ];

  function tocarNota(
    context: AudioContext,
    destination: AudioNode,
    frequencia: number,
    duracao: number,
    volume: number,
    tipo: OscillatorType = "sine"
  ) {
    const oscillator = context.createOscillator();
    const gain = context.createGain();

    oscillator.type = tipo;
    oscillator.frequency.setValueAtTime(frequencia, context.currentTime);

    gain.gain.setValueAtTime(0.0001, context.currentTime);

    gain.gain.exponentialRampToValueAtTime(
      volume,
      context.currentTime + 0.03
    );

    gain.gain.exponentialRampToValueAtTime(
      0.0001,
      context.currentTime + duracao
    );

    oscillator.connect(gain);
    gain.connect(destination);

    oscillator.start();
    oscillator.stop(context.currentTime + duracao + 0.05);
  }

  function tocarPasso() {
    const musica = musicRef.current;

    if (!musica) return;

    const { context, master } = musica;

    const indiceAcorde = Math.floor(musica.step / 4) % acordes.length;
    const acorde = acordes[indiceAcorde];

    /*
     * Acorde ambiente
     */
    acorde.forEach((nota, index) => {
      tocarNota(
        context,
        master,
        nota,
        1.8,
        0.018,
        index === 0 ? "triangle" : "sine"
      );
    });

    /*
     * Baixo a cada 2 passos
     */
    if (musica.step % 2 === 0) {
      tocarNota(
        context,
        master,
        acorde[0] / 2,
        0.65,
        0.035,
        "triangle"
      );
    }

    /*
     * Pequena melodia variável
     */
    const usarMelodia = Math.random() > 0.25;

    if (usarMelodia) {
      const notasPossiveis = [
        acorde[0] * 2,
        acorde[1] * 2,
        acorde[2] * 2,
        acorde[1] * 1.5,
      ];

      const nota =
        notasPossiveis[
          Math.floor(Math.random() * notasPossiveis.length)
        ];

      tocarNota(
        context,
        master,
        nota,
        0.28 + Math.random() * 0.2,
        0.018,
        "sine"
      );
    }

    /*
     * Pequeno detalhe agudo ocasional
     */
    if (Math.random() > 0.82) {
      tocarNota(
        context,
        master,
        acorde[2] * 2,
        0.18,
        0.012,
        "sine"
      );
    }

    musica.step++;

    musica.timer = window.setTimeout(
      tocarPasso,
      stepDuration
    );
  }

  async function alternarMusica() {
    if (typeof window === "undefined") return;

    /*
     * Primeira ativação
     */
    if (!musicRef.current) {
      const AudioContextClass = window.AudioContext;
      const context = new AudioContextClass();

      const master = context.createGain();

      master.gain.setValueAtTime(0.0001, context.currentTime);

      master.gain.exponentialRampToValueAtTime(
        0.18,
        context.currentTime + 0.8
      );

      master.connect(context.destination);

      musicRef.current = {
        context,
        master,
        timer: null,
        step: 0,
      };

      await context.resume();

      setAtivo(true);

      tocarPasso();

      return;
    }

    const musica = musicRef.current;

    if (ativo) {
      if (musica.timer !== null) {
        clearTimeout(musica.timer);
        musica.timer = null;
      }

      musica.master.gain.cancelScheduledValues(
        musica.context.currentTime
      );

      musica.master.gain.setTargetAtTime(
        0.0001,
        musica.context.currentTime,
        0.15
      );

      setAtivo(false);

      return;
    }

    await musica.context.resume();

    musica.master.gain.cancelScheduledValues(
      musica.context.currentTime
    );

    musica.master.gain.setTargetAtTime(
      0.18,
      musica.context.currentTime,
      0.15
    );

    setAtivo(true);

    tocarPasso();
  }

  useEffect(() => {
    return () => {
      const musica = musicRef.current;

      if (!musica) return;

      if (musica.timer !== null) {
        clearTimeout(musica.timer);
      }

      musica.master.disconnect();

      void musica.context.close();
    };
  }, []);

  return (
    <button
      type="button"
      onClick={alternarMusica}
      aria-label={
        ativo ? "Desligar música" : "Ligar música"
      }
      className="
        fixed bottom-5 right-5 z-50
        flex items-center gap-2
        rounded-2xl
        border border-white/10
        bg-slate-950/70
        px-4 py-3
        text-xs font-bold text-white
        shadow-2xl
        backdrop-blur-xl
        transition-all duration-200
        hover:-translate-y-0.5
        hover:border-violet-400/30
        hover:bg-slate-900/80
        active:scale-95
      "
    >
      {ativo ? (
        <Volume2 className="h-4 w-4 text-violet-300" />
      ) : (
        <VolumeX className="h-4 w-4 text-white/50" />
      )}

      <span>
        {ativo ? "Música ligada" : "Ligar música"}
      </span>
    </button>
  );
}