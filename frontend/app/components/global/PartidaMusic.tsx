"use client";

import { Volume2, VolumeX } from "lucide-react";
import { useEffect, useRef, useState } from "react";

type MusicState = {
  context: AudioContext;
  master: GainNode;
  timer: number | null;
  step: number;
};

export default function PartidaMusic() {
  const [ativo, setAtivo] = useState(false);
  const musicRef = useRef<MusicState | null>(null);

  const bpm = 132;
  const stepDuration = (60 / bpm) * 1000;

  // Progressão com clima mais "battle / arcade"
  const acordes = [
    [261.63, 329.63, 392.0], // C
    [220.0, 261.63, 329.63], // Am
    [174.61, 220.0, 261.63], // F
    [196.0, 246.94, 293.66], // G
  ];

  function nota(
    context: AudioContext,
    destino: AudioNode,
    frequencia: number,
    duracao: number,
    volume: number,
    tipo: OscillatorType = "sawtooth"
  ) {
    const oscillator = context.createOscillator();
    const gain = context.createGain();

    oscillator.type = tipo;

    oscillator.frequency.setValueAtTime(
      frequencia,
      context.currentTime
    );

    gain.gain.setValueAtTime(
      0.0001,
      context.currentTime
    );

    gain.gain.exponentialRampToValueAtTime(
      volume,
      context.currentTime + 0.015
    );

    gain.gain.exponentialRampToValueAtTime(
      0.0001,
      context.currentTime + duracao
    );

    oscillator.connect(gain);
    gain.connect(destino);

    oscillator.start();

    oscillator.stop(
      context.currentTime + duracao + 0.03
    );
  }

  function bateria(
    context: AudioContext,
    destino: AudioNode,
    volume: number
  ) {
    const oscillator = context.createOscillator();
    const gain = context.createGain();

    oscillator.type = "square";
    oscillator.frequency.setValueAtTime(
      110,
      context.currentTime
    );

    oscillator.frequency.exponentialRampToValueAtTime(
      45,
      context.currentTime + 0.08
    );

    gain.gain.setValueAtTime(
      volume,
      context.currentTime
    );

    gain.gain.exponentialRampToValueAtTime(
      0.0001,
      context.currentTime + 0.1
    );

    oscillator.connect(gain);
    gain.connect(destino);

    oscillator.start();
    oscillator.stop(context.currentTime + 0.11);
  }

  function clap(
    context: AudioContext,
    destino: AudioNode
  ) {
    const oscillator = context.createOscillator();
    const gain = context.createGain();

    oscillator.type = "square";
    oscillator.frequency.value = 1800;

    gain.gain.setValueAtTime(
      0.025,
      context.currentTime
    );

    gain.gain.exponentialRampToValueAtTime(
      0.0001,
      context.currentTime + 0.07
    );

    oscillator.connect(gain);
    gain.connect(destino);

    oscillator.start();
    oscillator.stop(context.currentTime + 0.08);
  }

  function hiHat(
    context: AudioContext,
    destino: AudioNode
  ) {
    const oscillator = context.createOscillator();
    const gain = context.createGain();

    oscillator.type = "square";
    oscillator.frequency.value =
      3500 + Math.random() * 1200;

    gain.gain.setValueAtTime(
      0.008,
      context.currentTime
    );

    gain.gain.exponentialRampToValueAtTime(
      0.0001,
      context.currentTime + 0.035
    );

    oscillator.connect(gain);
    gain.connect(destino);

    oscillator.start();
    oscillator.stop(context.currentTime + 0.04);
  }

  function tocarPasso() {
    const musica = musicRef.current;

    if (!musica) return;

    const { context, master } = musica;

    const passo = musica.step;

    /*
     * Cada 8 passos muda o acorde.
     */
    const indiceAcorde =
      Math.floor(passo / 8) % acordes.length;

    const acorde = acordes[indiceAcorde];

    /*
     * KICK
     *
     * Batida principal.
     */
    if (passo % 2 === 0) {
      bateria(context, master, 0.045);
    }

    /*
     * CLAP
     *
     * Entra no contratempo.
     */
    if (passo % 4 === 2) {
      clap(context, master);
    }

    /*
     * HI-HAT
     *
     * Mantém a música movimentada.
     */
    hiHat(context, master);

    /*
     * BAIXO
     */
    if (passo % 2 === 0) {
      const oitavaBaixo =
        acorde[0] / 2;

      nota(
        context,
        master,
        oitavaBaixo,
        0.18,
        0.045,
        "square"
      );
    }

    /*
     * Acorde curto.
     */
    if (passo % 4 === 0) {
      acorde.forEach((frequencia) => {
        nota(
          context,
          master,
          frequencia,
          0.35,
          0.018,
          "sawtooth"
        );
      });
    }

    /*
     * MELODIA
     *
     * A sequência muda um pouco a cada ciclo.
     */
    const notasMelodia = [
      acorde[0] * 2,
      acorde[1] * 2,
      acorde[2] * 2,
      acorde[1] * 2.5,
    ];

    let notaEscolhida: number;

    if (Math.random() > 0.3) {
      notaEscolhida =
        notasMelodia[
          Math.floor(
            Math.random() *
              notasMelodia.length
          )
        ];
    } else {
      notaEscolhida =
        acorde[
          Math.floor(
            Math.random() * acorde.length
          )
        ] * 2;
    }

    /*
     * Melodia não toca em todos os passos,
     * evitando ficar robótica.
     */
    if (passo % 2 === 1) {
      nota(
        context,
        master,
        notaEscolhida,
        0.16 + Math.random() * 0.12,
        0.018,
        "triangle"
      );
    }

    /*
     * Pequeno "efeito" ocasional.
     */
    if (Math.random() > 0.88) {
      nota(
        context,
        master,
        acorde[2] * 4,
        0.08,
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
    if (typeof window === "undefined") {
      return;
    }

    /*
     * PRIMEIRA VEZ
     */
    if (!musicRef.current) {
      const AudioContextClass =
        window.AudioContext;

      const context =
        new AudioContextClass();

      const master =
        context.createGain();

      master.gain.setValueAtTime(
        0.0001,
        context.currentTime
      );

      /*
       * Volume geral.
       *
       * Mesmo sendo uma música animada,
       * não fica alta demais.
       */
      master.gain.exponentialRampToValueAtTime(
        0.14,
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

    /*
     * DESLIGAR
     */
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
        0.12
      );

      setAtivo(false);

      return;
    }

    /*
     * LIGAR NOVAMENTE
     */
    await musica.context.resume();

    musica.master.gain.cancelScheduledValues(
      musica.context.currentTime
    );

    musica.master.gain.setTargetAtTime(
      0.14,
      musica.context.currentTime,
      0.12
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

      void musica.context.close();
    };
  }, []);

  return (
    <button
      type="button"
      onClick={alternarMusica}
      aria-label={
        ativo
          ? "Desligar música"
          : "Ligar música"
      }
      className="
        fixed bottom-5 right-5 z-50
        flex items-center gap-2
        rounded-2xl
        border border-white/10
        bg-slate-950/75
        px-4 py-3
        text-xs font-bold text-white
        shadow-2xl
        backdrop-blur-xl
        transition-all duration-200
        hover:-translate-y-0.5
        hover:border-violet-400/40
        hover:bg-slate-900/90
        active:scale-95
      "
    >
      {ativo ? (
        <Volume2
          className="
            h-4 w-4
            text-violet-300
          "
        />
      ) : (
        <VolumeX
          className="
            h-4 w-4
            text-white/50
          "
        />
      )}

      <span>
        {ativo
          ? "Música ligada"
          : "Ligar música"}
      </span>
    </button>
  );
}