"use client";

import {
  ArrowRight,
  Crown,
  Gamepad2,
  Plus,
  Shield,
  Sparkles,
  Swords,
  Tags,
  Trophy,
  Users,
} from "lucide-react";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";

import Header from "../components/inicio/Header";
import LoadingOverlay from "../components/global/Loading";

interface Usuario {
  id: number;
  nome: string;
  email: string;
  role: "ADMIN" | "JOGADOR";
  patenteId: number | null;
  patente?: {
    id: number;
    nome: string;
  } | null;
}

interface Jogador {
  id: number;
  usuarioId: number;
  eliminado: boolean;
  usuario: Usuario;
}

interface Sala {

  id: number;
  nome: string;
  codigo: string;
  status: string;
  maxJogadores: number;

  _count?: {
    jogadores: number;
    rodadas: number;
  };
}

interface Pergunta {
  id: number;
  enunciado: string;
  temaId: number;
}

export default function Home() {
  const router = useRouter();

  const API = process.env.NEXT_PUBLIC_API;

  const [loading, setLoading] = useState(false)

  const token = Cookies.get("token");

  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [salas, setSalas] = useState<Sala[]>([]);
  const [perguntas, setPerguntas] = useState<Pergunta[]>([]);

  const [codigo, setCodigo] = useState("");

  const [loadingUsuario, setLoadingUsuario] = useState(false);
  const [loadingSalas, setLoadingSalas] = useState(false);
  const [loadingPerguntas, setLoadingPerguntas] = useState(false);

  /*
   * ============================
   * BUSCAR USUÁRIO
   * ============================
   */

  const buscarUsuario = async () => {
    if (!token) {
      return;
    }

    try {
      setLoadingUsuario(true);

      const payload = JSON.parse(
        atob(token.split(".")[1])
      );

      const id = payload.sub;

      if (!id) {
        throw new Error("Usuário não encontrado no token");
      }

      const res = await fetch(`${API}/usuario/${id}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        throw new Error("Erro ao buscar usuário");
      }

      const data: Usuario = await res.json();

      setUsuario(data);
    } catch (error) {
      console.error("Erro ao buscar usuário:", error);
    } finally {
      setLoadingUsuario(false);
    }
  };

  /*
   * ============================
   * BUSCAR SALAS
   * ============================
   */

  const buscarSalas = async () => {
    try {
      setLoadingSalas(true);

      const res = await fetch(`${API}/sala`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        throw new Error("Erro ao buscar salas");
      }

      const data: Sala[] = await res.json();

      setSalas(data);
    } catch (error) {
      console.error("Erro ao buscar salas:", error);
    } finally {
      setLoadingSalas(false);
    }
  };

  /*
   * ============================
   * BUSCAR PERGUNTAS
   * ============================
   */

  const buscarPerguntas = async () => {
    if (!token) {
      return;
    }

    try {
      setLoadingPerguntas(true);

      const res = await fetch(`${API}/pergunta`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        throw new Error("Erro ao buscar perguntas");
      }

      const data: Pergunta[] = await res.json();

      setPerguntas(data);
    } catch (error) {
      console.error("Erro ao buscar perguntas:", error);
    } finally {
      setLoadingPerguntas(false);
    }
  };

  /*
   * ============================
   * BUSCAR DADOS AO ABRIR
   * ============================
   */

  useEffect(() => {
    buscarUsuario();
    buscarSalas();
    buscarPerguntas();
  }, []);

  /*
   * ============================
   * SALAS ABERTAS
   * ============================
   */

  const salasAbertas = useMemo(() => {
    return salas.filter(
      (sala) => sala.status === "ABERTA"
    );
  }, [salas]);

  /*
   * ============================
   * JOGADORES NAS SALAS
   * ============================
   */

  const jogadoresNasSalas = useMemo(() => {
    return salas.reduce((total, sala) => {
      return total + (sala._count?.jogadores ?? 0);
    }, 0);
  }, [salas]);

  /*
   * ============================
   * ENTRAR NA SALA
   * ============================
   */


  async function entrarNaSala() {
    try {
      setLoading(true);

      const token = Cookies.get("token");

      if (!token) {
        router.push("/login");
        return;
      }

      const res = await fetch(`${API}/sala/entrar`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          codigo: codigo.trim().toUpperCase(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          Array.isArray(data.message)
            ? data.message.join(", ")
            : data.message || "Erro ao entrar na sala"
        );
      }

      router.push(`/sala/entrar?codigo=${codigo.trim().toUpperCase()}`);
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false);
    }
  }

  /*
   * ============================
   * RENDER
   * ============================
   */

  return (
    <main className="min-h-screen overflow-hidden bg-[#080812] text-white">

      <LoadingOverlay show={loading} />

      {/* Background */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">

        <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-violet-600/10 blur-3xl" />

        <div className="absolute right-[-120px] top-1/3 h-[500px] w-[500px] rounded-full bg-fuchsia-600/10 blur-3xl" />

        <div className="absolute bottom-[-200px] left-1/3 h-[500px] w-[500px] rounded-full bg-indigo-600/10 blur-3xl" />

        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(139,92,246,0.04),transparent_55%)]" />

      </div>

      {/* Header */}
      <Header
        nome={usuario?.nome}
        patente={usuario?.patente?.nome}
      />

      {/* Conteúdo */}
      <section className="relative z-10 mx-auto max-w-7xl px-5 pb-16 pt-32">

        {/* Hero */}
        <div className="mb-10 max-w-3xl">



          <h2 className="text-4xl font-black tracking-tight sm:text-5xl">

            Pronto para entrar
            <br />

            <span className="bg-gradient-to-r from-violet-400 via-fuchsia-400 to-pink-400 bg-clip-text text-transparent">
              na batalha?
            </span>

          </h2>

          <p className="mt-4 max-w-xl text-sm leading-6 text-white/45">
            Entre em uma sala existente ou crie sua própria
            batalha e configure as perguntas que serão usadas
            na partida.
          </p>

        </div>

        {/* Ações */}
        <div className="grid gap-5 lg:grid-cols-2">

          {/* Entrar */}
          <div className="group relative overflow-hidden rounded-3xl border border-violet-400/20 bg-gradient-to-br from-violet-600/20 via-[#161427] to-[#10101b] p-6">

            <div className="absolute -right-16 -top-16 h-40 w-40 rounded-full bg-violet-500/10 blur-3xl" />

            <div className="relative">

              <div className="mb-7 flex items-center justify-between">

                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-500/15 text-violet-300">
                  <Gamepad2 size={24} />
                </div>

                <Users
                  size={20}
                  className="text-white/20"
                />

              </div>

              <h3 className="text-xl font-black">
                Entrar em uma sala
              </h3>

              <p className="mt-2 text-sm leading-6 text-white/40">
                Digite o código da sala para participar
                de uma batalha.
              </p>

              <div className="mt-6 flex gap-3">

                <input
                  value={codigo}
                  onChange={(e) =>
                    setCodigo(e.target.value.toUpperCase())
                  }
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      entrarNaSala();
                    }
                  }}
                  placeholder="CÓDIGO DA SALA"
                  maxLength={20}
                  className="h-12 min-w-0 flex-1 rounded-xl border border-white/10 bg-black/20 px-4 text-sm font-bold tracking-widest text-white outline-none placeholder:text-white/20 focus:border-violet-400/50"
                />

                <button
                  onClick={entrarNaSala}
                  disabled={!codigo.trim()}
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-violet-500 transition hover:bg-violet-400 disabled:cursor-not-allowed disabled:opacity-30"
                >
                  <ArrowRight size={19} />
                </button>

              </div>

            </div>

          </div>

          {/* Criar sala */}
          <button
            onClick={() => router.push("sala/criar")}
            className="group relative overflow-hidden rounded-3xl border border-fuchsia-400/20 bg-gradient-to-br from-fuchsia-600/15 via-[#161322] to-[#10101b] p-6 text-left transition duration-300 hover:-translate-y-1 hover:border-fuchsia-400/40 hover:shadow-2xl hover:shadow-fuchsia-950/20"
          >

            <div className="absolute -right-16 -top-16 h-40 w-40 rounded-full bg-fuchsia-500/10 blur-3xl" />

            <div className="relative">

              <div className="mb-8 flex items-center justify-between">

                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-fuchsia-500/15 text-fuchsia-300">
                  <Plus size={24} />
                </div>

                <ArrowRight
                  size={20}
                  className="text-white/25 transition group-hover:translate-x-1 group-hover:text-fuchsia-300"
                />

              </div>

              <h3 className="text-xl font-black">
                Criar uma sala
              </h3>

              <p className="mt-2 text-sm leading-6 text-white/40">
                Crie uma batalha, defina os jogadores e
                configure as perguntas e alternativas da
                partida.
              </p>

              <div className="mt-6 flex items-center gap-2 text-xs font-bold text-fuchsia-300">
                <Crown size={14} />
                Montar nova batalha
              </div>

            </div>

          </button>

        </div>

        {/* Salas */}
        <div className="mt-6 rounded-3xl border border-white/10 bg-[#10101b]/70 p-6 backdrop-blur-xl">

          <div className="mb-6 flex items-center justify-between">

            <div>

              <div className="flex items-center gap-2">

                <Swords
                  size={18}
                  className="text-violet-300"
                />

                <h3 className="text-lg font-black">
                  Salas abertas
                </h3>

              </div>

              <p className="mt-1 text-xs text-white/30">
                Partidas aguardando jogadores.
              </p>

            </div>

            <span className="rounded-lg border border-violet-400/10 bg-violet-500/10 px-3 py-1.5 text-xs font-bold text-violet-300">
              {salasAbertas.length} abertas
            </span>

          </div>

          {loadingSalas ? (

            <div className="flex h-24 items-center justify-center text-sm text-white/30">
              Carregando salas...
            </div>

          ) : salasAbertas.length === 0 ? (

            <div className="flex h-24 items-center justify-center rounded-2xl border border-dashed border-white/10 text-sm text-white/25">
              Nenhuma sala aberta no momento.
            </div>

          ) : (

            <div className="grid gap-3 md:grid-cols-3">

              {salasAbertas.map((sala) => (

                <button
                  key={sala.id}
                  onClick={() => setCodigo(sala.codigo)}
                  className="rounded-2xl border border-white/10 bg-white/[0.025] p-4 text-left transition hover:border-violet-400/30 hover:bg-violet-500/5"
                >

                  <div className="flex items-center justify-between">

                    <span className="truncate text-sm font-bold">
                      {sala.nome}
                    </span>

                    <span className="h-2 w-2 rounded-full bg-emerald-400" />

                  </div>

                  <div className="mt-4 flex items-center justify-between">

                    <span className="font-mono text-xs tracking-widest text-violet-300">
                      {sala.codigo}
                    </span>

                    <span className="flex items-center gap-1 text-[10px] text-white/25">

                      <Users size={11} />

                      {sala._count?.jogadores ?? 0}/
                      {sala.maxJogadores}

                    </span>

                  </div>

                </button>

              ))}

            </div>

          )}

        </div>

        {/* Informações */}
        <div className="mt-6 grid gap-5 lg:grid-cols-[1.5fr_1fr]">

          {/* Conteúdo */}
          <div className="rounded-3xl border border-white/10 bg-[#10101b]/80 p-7 backdrop-blur-xl">

            <div className="flex items-center justify-between">

              <div>

                <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl bg-white/5 text-white/70">
                  <Tags size={21} />
                </div>

                <h3 className="text-lg font-black">
                  Banco de perguntas
                </h3>

                <p className="mt-2 max-w-md text-sm leading-6 text-white/35">
                  As perguntas e alternativas são utilizadas
                  para montar as rodadas das suas batalhas.
                </p>

              </div>

              <div className="ml-5 flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-fuchsia-400/10 bg-fuchsia-500/5">

                <span className="text-xl font-black text-fuchsia-300">
                  {loadingPerguntas
                    ? "..."
                    : perguntas.length}
                </span>

              </div>

            </div>

          </div>

          {/* Patente */}
          <button
            onClick={() => router.push("/perfil")}
            className="group relative overflow-hidden rounded-3xl border border-amber-400/15 bg-gradient-to-br from-amber-500/10 via-[#15131b] to-[#10101b] p-7 text-left transition hover:-translate-y-1 hover:border-amber-400/30"
          >

            <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-amber-500/10 blur-3xl" />

            <div className="relative">

              <div className="flex items-start justify-between">

                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-500/10 text-amber-300">
                  <Trophy size={21} />
                </div>

                <Shield
                  size={18}
                  className="text-amber-300/30"
                />

              </div>

              <p className="mt-6 text-[10px] font-bold uppercase tracking-[0.2em] text-white/30">
                Sua patente
              </p>

              <h3 className="mt-1 text-xl font-black">
                {loadingUsuario
                  ? "Carregando..."
                  : usuario?.patente?.nome ?? "Sem patente"}
              </h3>

            </div>

          </button>

        </div>

      </section>
    </main>
  );
}