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

export default function BackgroundMusic() {
  const [ativo, setAtivo] = useState(false);
  const musicRef = useRef<MusicState | null>(null);

  const bpm = 118;
  const stepDuration = (60 / bpm / 2) * 1000;

  /*
   * Progressão:
   * C → Am → F → G
   */
  const acordes = [
    [261.63, 329.63, 392.0],
    [220.0, 261.63, 329.63],
    [174.61, 220.0, 261.63],
    [196.0, 246.94, 293.66],
  ];

  /*
   * Melodias diferentes para cada parte.
   */
  const melodias = [
    [
      523.25,
      659.25,
      783.99,
      659.25,
      587.33,
      523.25,
      493.88,
      523.25,
    ],
    [
      440.0,
      523.25,
      659.25,
      783.99,
      659.25,
      523.25,
      493.88,
      440.0,
    ],
    [
      523.25,
      587.33,
      698.46,
      783.99,
      698.46,
      659.25,
      587.33,
      523.25,
    ],
    [
      587.33,
      659.25,
      783.99,
      880.0,
      783.99,
      659.25,
      587.33,
      659.25,
    ],
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
    gain.connect(destination);

    oscillator.start();

    oscillator.stop(
      context.currentTime + duracao + 0.03
    );
  }

  function tocarKick(
    context: AudioContext,
    destination: AudioNode
  ) {
    const oscillator = context.createOscillator();
    const gain = context.createGain();

    oscillator.type = "sine";

    oscillator.frequency.setValueAtTime(
      150,
      context.currentTime
    );

    oscillator.frequency.exponentialRampToValueAtTime(
      45,
      context.currentTime + 0.12
    );

    gain.gain.setValueAtTime(
      0.16,
      context.currentTime
    );

    gain.gain.exponentialRampToValueAtTime(
      0.0001,
      context.currentTime + 0.14
    );

    oscillator.connect(gain);
    gain.connect(destination);

    oscillator.start();

    oscillator.stop(
      context.currentTime + 0.15
    );
  }

  function tocarSnare(
    context: AudioContext,
    destination: AudioNode
  ) {
    const oscillator = context.createOscillator();
    const gain = context.createGain();

    oscillator.type = "triangle";
    oscillator.frequency.value = 180;

    gain.gain.setValueAtTime(
      0.045,
      context.currentTime
    );

    gain.gain.exponentialRampToValueAtTime(
      0.0001,
      context.currentTime + 0.09
    );

    oscillator.connect(gain);
    gain.connect(destination);

    oscillator.start();

    oscillator.stop(
      context.currentTime + 0.1
    );
  }

  function tocarHat(
    context: AudioContext,
    destination: AudioNode
  ) {
    const oscillator = context.createOscillator();
    const gain = context.createGain();

    oscillator.type = "square";

    oscillator.frequency.value =
      4000 + Math.random() * 1000;

    gain.gain.setValueAtTime(
      0.018,
      context.currentTime
    );

    gain.gain.exponentialRampToValueAtTime(
      0.0001,
      context.currentTime + 0.035
    );

    oscillator.connect(gain);
    gain.connect(destination);

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

    const compasso =
      Math.floor(passo / 16);

    const indiceAcorde =
      compasso % acordes.length;

    const acorde =
      acordes[indiceAcorde];

    const melodia =
      melodias[indiceAcorde];

    /*
     * =========================
     * BATERIA
     * =========================
     */

    // Kick
    if (
      passo % 4 === 0 ||
      (passo % 8 === 3 &&
        Math.random() > 0.35)
    ) {
      tocarKick(context, master);
    }

    // Snare
    if (passo % 8 === 4) {
      tocarSnare(context, master);
    }

    // Hi-hat
    tocarHat(context, master);

    /*
     * =========================
     * BAIXO
     * =========================
     */

    if (passo % 2 === 0) {
      const baixo =
        acorde[0] / 2;

      tocarNota(
        context,
        master,
        baixo,
        0.22,
        0.055,
        "sawtooth"
      );

      /*
       * Pequena variação
       */
      if (
        passo % 8 === 6 &&
        Math.random() > 0.35
      ) {
        tocarNota(
          context,
          master,
          acorde[2] / 2,
          0.16,
          0.04,
          "square"
        );
      }
    }

    /*
     * =========================
     * ACORDES
     * =========================
     */

    if (passo % 8 === 0) {
      acorde.forEach(
        (frequencia, index) => {
          tocarNota(
            context,
            master,
            frequencia,
            0.8,
            index === 0
              ? 0.025
              : 0.018,
            "triangle"
          );
        }
      );
    }

    /*
     * =========================
     * ARPEJO
     * =========================
     */

    const notaArpejo =
      acorde[
        passo % 3
      ];

    tocarNota(
      context,
      master,
      notaArpejo * 2,
      0.18,
      0.018,
      "square"
    );

    /*
     * =========================
     * MELODIA
     * =========================
     */

    if (passo % 2 === 0) {
      let nota =
        melodia[
          Math.floor(
            passo / 2
          ) % melodia.length
        ];

      /*
       * Pequena variação
       */
      if (Math.random() > 0.78) {
        nota *= Math.random() > 0.5
          ? 1.122
          : 0.891;
      }

      tocarNota(
        context,
        master,
        nota,
        0.22,
        0.035,
        "triangle"
      );
    }

    /*
     * =========================
     * FILL
     * =========================
     */

    if (
      passo % 16 === 14 &&
      Math.random() > 0.25
    ) {
      tocarNota(
        context,
        master,
        acorde[2] * 2,
        0.1,
        0.025,
        "sine"
      );
    }

    musica.step++;

    musica.timer = window.setTimeout(
      tocarPasso,
      stepDuration
    );
  }

  /*
   * Cria o AudioContext.
   */
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
      console.error(
        "Web Audio API não suportada."
      );

      return null;
    }

    const context =
      new AudioContextClass();

    const master =
      context.createGain();

    /*
     * Volume geral
     */
    master.gain.value = 0.28;

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

  /*
   * Inicia a música.
   */
  async function iniciarMusica() {
    const musica =
      await criarMusica();

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
      0.28,
      musica.context.currentTime,
      0.08
    );

    musica.tocando = true;

    setAtivo(true);

    tocarPasso();
  }

  /*
   * Desliga a música.
   */
  function pararMusica() {
    const musica =
      musicRef.current;

    if (!musica) {
      return;
    }

    musica.tocando = false;

    if (musica.timer !== null) {
      clearTimeout(
        musica.timer
      );

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

  /*
   * Botão de música.
   */
  async function alternarMusica() {
    if (ativo) {
      pararMusica();
    } else {
      await iniciarMusica();
    }
  }

  /*
   * TENTA INICIAR AUTOMATICAMENTE
   */
  useEffect(() => {
    void iniciarMusica();

    /*
     * Se o navegador bloquear autoplay,
     * o primeiro clique libera o áudio.
     */
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

      const musica =
        musicRef.current;

      if (!musica) {
        return;
      }

      musica.tocando = false;

      if (
        musica.timer !== null
      ) {
        clearTimeout(
          musica.timer
        );
      }

      void musica.context.close();

      musicRef.current = null;
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