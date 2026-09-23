"use client";

import { Volume2, VolumeX } from "lucide-react";
import { useEffect, useRef, useState } from "react";

type MusicState = {
  context: AudioContext;
  master: GainNode;
  timer: number | null;
  step: number;
  tocando: boolean;
};

export default function PartidaMusic() {
  const [ativo, setAtivo] = useState(false);
  const musicRef = useRef<MusicState | null>(null);

  const bpm = 132;
  const stepDuration = (60 / bpm) * 1000;

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
      context.currentTime + 0.01
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
    volume = 0.09
  ) {
    const oscillator = context.createOscillator();
    const gain = context.createGain();

    oscillator.type = "sine";

    oscillator.frequency.setValueAtTime(
      150,
      context.currentTime
    );

    oscillator.frequency.exponentialRampToValueAtTime(
      42,
      context.currentTime + 0.11
    );

    gain.gain.setValueAtTime(
      volume,
      context.currentTime
    );

    gain.gain.exponentialRampToValueAtTime(
      0.0001,
      context.currentTime + 0.13
    );

    oscillator.connect(gain);
    gain.connect(destino);

    oscillator.start();

    oscillator.stop(
      context.currentTime + 0.14
    );
  }

  function clap(
    context: AudioContext,
    destino: AudioNode
  ) {
    const oscillator = context.createOscillator();
    const gain = context.createGain();

    oscillator.type = "triangle";

    oscillator.frequency.setValueAtTime(
      1600,
      context.currentTime
    );

    oscillator.frequency.exponentialRampToValueAtTime(
      600,
      context.currentTime + 0.08
    );

    gain.gain.setValueAtTime(
      0.055,
      context.currentTime
    );

    gain.gain.exponentialRampToValueAtTime(
      0.0001,
      context.currentTime + 0.09
    );

    oscillator.connect(gain);
    gain.connect(destino);

    oscillator.start();

    oscillator.stop(
      context.currentTime + 0.1
    );
  }

  function hiHat(
    context: AudioContext,
    destino: AudioNode
  ) {
    const oscillator = context.createOscillator();
    const gain = context.createGain();

    oscillator.type = "square";

    oscillator.frequency.value =
      4500 + Math.random() * 1800;

    gain.gain.setValueAtTime(
      0.025,
      context.currentTime
    );

    gain.gain.exponentialRampToValueAtTime(
      0.0001,
      context.currentTime + 0.035
    );

    oscillator.connect(gain);
    gain.connect(destino);

    oscillator.start();

    oscillator.stop(
      context.currentTime + 0.04
    );
  }

  function tocarPasso() {
    const musica = musicRef.current;

    if (!musica || !musica.tocando) {
      return;
    }

    const { context, master } = musica;
    const passo = musica.step;

    const indiceAcorde =
      Math.floor(passo / 8) % acordes.length;

    const acorde = acordes[indiceAcorde];

    /*
     * ==========================
     * KICK
     * ==========================
     */

    if (passo % 2 === 0) {
      bateria(context, master, 0.11);
    }

    /*
     * ==========================
     * CLAP
     * ==========================
     */

    if (passo % 4 === 2) {
      clap(context, master);
    }

    /*
     * ==========================
     * HI-HAT
     * ==========================
     */

    hiHat(context, master);

    /*
     * ==========================
     * BAIXO
     * ==========================
     */

    if (passo % 2 === 0) {
      nota(
        context,
        master,
        acorde[0] / 2,
        0.22,
        0.085,
        "square"
      );
    }

    /*
     * ==========================
     * SEGUNDO BAIXO
     * ==========================
     */

    if (passo % 8 === 6) {
      nota(
        context,
        master,
        acorde[2] / 2,
        0.16,
        0.065,
        "square"
      );
    }

    /*
     * ==========================
     * ACORDES
     * ==========================
     */

    if (passo % 4 === 0) {
      acorde.forEach((frequencia) => {
        nota(
          context,
          master,
          frequencia,
          0.5,
          0.035,
          "sawtooth"
        );
      });
    }

    /*
     * ==========================
     * ARPEJO
     * ==========================
     */

    const arpejo = [
      acorde[0] * 2,
      acorde[1] * 2,
      acorde[2] * 2,
      acorde[1] * 2,
    ];

    nota(
      context,
      master,
      arpejo[passo % arpejo.length],
      0.16,
      0.035,
      "square"
    );

    /*
     * ==========================
     * MELODIA
     * ==========================
     */

    const melodia = [
      acorde[0] * 2,
      acorde[1] * 2,
      acorde[2] * 2,
      acorde[1] * 2,
      acorde[2] * 2.5,
      acorde[1] * 2,
      acorde[0] * 2,
      acorde[2] * 2,
    ];

    if (passo % 2 === 1) {
      const notaMelodia =
        melodia[
          Math.floor(passo / 2) %
            melodia.length
        ];

      nota(
        context,
        master,
        notaMelodia,
        0.22,
        0.055,
        "triangle"
      );
    }

    /*
     * ==========================
     * EFEITO DE TRANSIÇÃO
     * ==========================
     */

    if (
      passo % 16 === 15
    ) {
      nota(
        context,
        master,
        acorde[2] * 2,
        0.12,
        0.035,
        "sine"
      );
    }

    musica.step++;

    musica.timer = window.setTimeout(
      tocarPasso,
      stepDuration
    );
  }

  async function criarMusica() {
    if (musicRef.current) {
      return musicRef.current;
    }

    const AudioContextClass =
      window.AudioContext ||
      (
        window as typeof window & {
          webkitAudioContext?: typeof AudioContext;
        }
      ).webkitAudioContext;

    if (!AudioContextClass) {
      return null;
    }

    const context =
      new AudioContextClass();

    const master =
      context.createGain();

    /*
     * VOLUME GERAL
     *
     * Antes: 0.14
     * Agora: 0.30
     */
    master.gain.setValueAtTime(
      0.0001,
      context.currentTime
    );

    master.connect(
      context.destination
    );

    const musica: MusicState = {
      context,
      master,
      timer: null,
      step: 0,
      tocando: false,
    };

    musicRef.current = musica;

    await context.resume();

    return musica;
  }

  async function iniciarMusica() {
    const musica = await criarMusica();

    if (!musica) {
      return;
    }

    if (musica.tocando) {
      return;
    }

    await musica.context.resume();

    musica.master.gain.cancelScheduledValues(
      musica.context.currentTime
    );

    musica.master.gain.setTargetAtTime(
      0.30,
      musica.context.currentTime,
      0.08
    );

    musica.tocando = true;

    setAtivo(true);

    tocarPasso();
  }

  function pararMusica() {
    const musica = musicRef.current;

    if (!musica) {
      return;
    }

    musica.tocando = false;

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
      0.08
    );

    setAtivo(false);
  }

  async function alternarMusica() {
    if (ativo) {
      pararMusica();
    } else {
      await iniciarMusica();
    }
  }

  /*
   * TENTA COMEÇAR AUTOMATICAMENTE
   */
  useEffect(() => {
    void iniciarMusica();

    return () => {
      const musica = musicRef.current;

      if (!musica) {
        return;
      }

      musica.tocando = false;

      if (musica.timer !== null) {
        clearTimeout(musica.timer);
      }

      void musica.context.close();

      musicRef.current = null;
    };
  }, []);

  /*
   * Alguns navegadores bloqueiam
   * autoplay de áudio.
   *
   * Quando o usuário clicar em
   * qualquer lugar da página,
   * tentamos iniciar novamente.
   */
  useEffect(() => {
    if (ativo) {
      return;
    }

    const iniciarDepoisDoClique =
      () => {
        void iniciarMusica();
      };

    window.addEventListener(
      "click",
      iniciarDepoisDoClique,
      { once: true }
    );

    return () => {
      window.removeEventListener(
        "click",
        iniciarDepoisDoClique
      );
    };
  }, [ativo]);

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
        bg-slate-950/80
        px-4 py-3
        text-xs font-bold text-white
        shadow-2xl
        backdrop-blur-xl
        transition-all duration-200
        hover:-translate-y-0.5
        hover:border-violet-400/40
        hover:bg-slate-900
        active:scale-95
      "
    >
      {ativo ? (
        <Volume2
          size={17}
          className="text-violet-300"
        />
      ) : (
        <VolumeX
          size={17}
          className="text-white/50"
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