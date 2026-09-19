"use client";

import {
  ArrowRight,
  Crown,
  Gamepad2,
  Plus,
  Shield,
  Swords,
  Tags,
  Trophy,
  Users,
  Zap,
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
  pontuacao: number;
  patente?: {
    id: number;
    nome: string;
    pontos: number;
  } | null;
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

const glassCard =
  "border border-white/[0.08] bg-[#12121d]/80 shadow-[0_20px_80px_rgba(0,0,0,0.22)] backdrop-blur-xl";

export default function Home() {
  const router = useRouter();
  const API = process.env.NEXT_PUBLIC_API;
  const token = Cookies.get("token");

  const [loading, setLoading] = useState(false);
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [salas, setSalas] = useState<Sala[]>([]);
  const [perguntas, setPerguntas] = useState<Pergunta[]>([]);
  const [codigo, setCodigo] = useState("");
  const [loadingUsuario, setLoadingUsuario] = useState(false);
  const [loadingSalas, setLoadingSalas] = useState(false);
  const [loadingPerguntas, setLoadingPerguntas] = useState(false);

  const buscarUsuario = async () => {
    if (!token) return;

    try {
      setLoadingUsuario(true);
      const payload = JSON.parse(atob(token.split(".")[1]));
      const id = payload.sub;
      if (!id) throw new Error("Usuário não encontrado no token");

      const res = await fetch(`${API}/usuario/${id}`, {
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Erro ao buscar usuário");
      setUsuario(await res.json());
    } catch (error) {
      console.error("Erro ao buscar usuário:", error);
    } finally {
      setLoadingUsuario(false);
    }
  };

  const buscarSalas = async () => {
    try {
      setLoadingSalas(true);
      const res = await fetch(`${API}/sala`, {
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Erro ao buscar salas");
      setSalas(await res.json());
    } catch (error) {
      console.error("Erro ao buscar salas:", error);
    } finally {
      setLoadingSalas(false);
    }
  };

  const buscarPerguntas = async () => {
    if (!token) return;

    try {
      setLoadingPerguntas(true);
      const res = await fetch(`${API}/pergunta`, {
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Erro ao buscar perguntas");
      setPerguntas(await res.json());
    } catch (error) {
      console.error("Erro ao buscar perguntas:", error);
    } finally {
      setLoadingPerguntas(false);
    }
  };

  useEffect(() => {
    buscarUsuario();
    buscarSalas();
    buscarPerguntas();
  }, []);

  const salasAbertas = useMemo(
    () => salas.filter((sala) => sala.status === "ABERTA"),
    [salas]
  );

  const jogadoresNasSalas = useMemo(
    () => salas.reduce((total, sala) => total + (sala._count?.jogadores ?? 0), 0),
    [salas]
  );

  async function entrarNaSala() {
    try {
      setLoading(true);
      const currentToken = Cookies.get("token");
      if (!currentToken) {
        router.push("/login");
        return;
      }

      const codigoFormatado = codigo.trim().toUpperCase();
      const res = await fetch(`${API}/sala/entrar`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${currentToken}` },
        body: JSON.stringify({ codigo: codigoFormatado }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          Array.isArray(data.message) ? data.message.join(", ") : data.message || "Erro ao entrar na sala"
        );
      }

      router.push(`/sala/entrar?codigo=${codigoFormatado}`);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen overflow-hidden bg-[#080811] text-white selection:bg-violet-400/30">
      <LoadingOverlay show={loading} />

      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-48 -top-48 h-[34rem] w-[34rem] rounded-full bg-violet-600/20 blur-[110px]" />
        <div className="absolute -right-40 top-1/4 h-[30rem] w-[30rem] rounded-full bg-fuchsia-600/10 blur-[120px]" />
        <div className="absolute bottom-[-18rem] left-1/3 h-[34rem] w-[34rem] rounded-full bg-indigo-600/10 blur-[120px]" />
        <div className="absolute inset-0 opacity-[0.035] [background-image:linear-gradient(rgba(255,255,255,.7)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.7)_1px,transparent_1px)] [background-size:56px_56px]" />
      </div>

      <Header nome={usuario?.nome} patente={usuario?.patente?.nome} />

      <section className="relative z-10 mx-auto max-w-7xl px-5 pb-16 pt-28 sm:px-8 lg:pt-32">
        <div className="mb-10 flex flex-col justify-between gap-8 lg:flex-row lg:items-end">
          <div className="max-w-2xl">

            <h1 className="text-4xl font-black leading-[1.02] tracking-[-0.04em] sm:text-6xl">
              Pronto para
              <span className="block  bg-fuchsia-300 bg-clip-text text-transparent">
                dominar a arena?
              </span>
            </h1>
            <p className="mt-5 max-w-xl text-sm leading-7 text-white/45 sm:text-base">
              Entre em uma batalha, desafie seus amigos e suba no ranking respondendo perguntas em tempo recorde.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <div className={`${glassCard} rounded-2xl px-4 py-3`}>
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/30">Salas abertas</p>
              <p className="mt-1 text-2xl font-black text-violet-200">{salasAbertas.length}</p>
            </div>
            <div className={`${glassCard} rounded-2xl px-4 py-3`}>
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/30">Jogadores</p>
              <p className="mt-1 text-2xl font-black text-fuchsia-200">{jogadoresNasSalas}</p>
            </div>
            <div className={`${glassCard} col-span-2 rounded-2xl px-4 py-3 sm:col-span-1`}>
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/30">Perguntas</p>
              <p className="mt-1 text-2xl font-black text-amber-200">{loadingPerguntas ? "—" : perguntas.length}</p>
            </div>
          </div>
        </div>

        <div className="grid gap-5 lg:grid-cols-2">
          <div className="group relative overflow-hidden rounded-[2rem] border border-violet-300/20 bg-gradient-to-br from-violet-500/20 via-[#18152b] to-[#11111c] p-6 sm:p-8">
            <div className="absolute -right-20 -top-20 h-56 w-56 rounded-full bg-violet-500/20 blur-[70px] transition duration-500 group-hover:bg-violet-400/30" />
            <div className="relative">
              <div className="flex items-start justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-400/15 text-violet-200 ring-1 ring-inset ring-violet-300/15">
                  <Gamepad2 size={23} />
                </div>
                <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-white/35">Quick join</span>
              </div>
              <h2 className="mt-8 text-2xl font-black tracking-tight">Entrar em uma sala</h2>
              <p className="mt-2 max-w-sm text-sm leading-6 text-white/45">Use o código compartilhado pelo criador da partida.</p>
              <div className="mt-7 flex gap-3">
                <input
                  value={codigo}
                  onChange={(e) => setCodigo(e.target.value.toUpperCase())}
                  onKeyDown={(e) => e.key === "Enter" && entrarNaSala()}
                  placeholder="CÓDIGO DA SALA"
                  maxLength={20}
                  aria-label="Código da sala"
                  className="h-13 min-w-0 flex-1 rounded-2xl border border-white/10 bg-black/25 px-4 text-sm font-bold tracking-[0.18em] text-white outline-none transition placeholder:text-white/20 focus:border-violet-300/60 focus:bg-black/35 focus:ring-4 focus:ring-violet-400/10"
                />
                <button
                  onClick={entrarNaSala}
                  disabled={!codigo.trim()}
                  aria-label="Entrar na sala"
                  className="flex h-13 w-13 shrink-0 items-center justify-center rounded-2xl bg-violet-400 text-[#171022] transition hover:bg-violet-300 hover:shadow-lg hover:shadow-violet-500/20 disabled:cursor-not-allowed disabled:opacity-30"
                >
                  <ArrowRight size={20} />
                </button>
              </div>
            </div>
          </div>

          <button
            onClick={() => router.push("sala/criar")}
            className="group relative overflow-hidden rounded-[2rem] border border-fuchsia-300/20 bg-gradient-to-br from-fuchsia-500/15 via-[#1b1428] to-[#11111c] p-6 text-left transition duration-300 hover:-translate-y-1 hover:border-fuchsia-300/45 hover:shadow-2xl hover:shadow-fuchsia-950/30 sm:p-8"
          >
            <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-fuchsia-500/15 blur-[70px] transition group-hover:bg-fuchsia-400/25" />
            <div className="relative flex h-full flex-col">
              <div className="flex items-start justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-fuchsia-400/15 text-fuchsia-200 ring-1 ring-inset ring-fuchsia-300/15">
                  <Plus size={23} />
                </div>
                <ArrowRight size={21} className="text-white/30 transition group-hover:translate-x-1 group-hover:text-fuchsia-200" />
              </div>
              <h2 className="mt-8 text-2xl font-black tracking-tight">Criar uma sala</h2>
              <p className="mt-2 max-w-sm text-sm leading-6 text-white/45">Monte sua própria batalha, escolha os jogadores e defina o ritmo do jogo.</p>
              <div className="mt-auto flex items-center gap-2 pt-7 text-xs font-bold text-fuchsia-200"><Crown size={14} /> Montar nova batalha</div>
            </div>
          </button>
        </div>

        <section className={`${glassCard} mt-6 rounded-[2rem] p-5 sm:p-7`}>
          <div className="mb-6 flex items-end justify-between gap-4">
            <div>
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-400/10 text-violet-200"><Swords size={18} /></div>
                <h2 className="text-xl font-black tracking-tight">Salas abertas</h2>
              </div>
              <p className="mt-2 text-sm text-white/35">Partidas esperando novos competidores.</p>
            </div>
            <span className="rounded-full border border-violet-300/15 bg-violet-400/10 px-3 py-1.5 text-xs font-bold text-violet-200">{salasAbertas.length} disponíveis</span>
          </div>

          {loadingSalas ? (
            <div className="grid gap-3 md:grid-cols-3">
              {[1, 2, 3].map((item) => <div key={item} className="h-24 animate-pulse rounded-2xl bg-white/[0.04]" />)}
            </div>
          ) : salasAbertas.length === 0 ? (
            <div className="flex min-h-28 flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 bg-white/[0.015] px-5 text-center">
              <Zap size={18} className="mb-2 text-white/25" />
              <p className="text-sm font-semibold text-white/45">Nenhuma sala aberta no momento.</p>
              <p className="mt-1 text-xs text-white/25">Crie uma sala e comece a primeira batalha.</p>
            </div>
          ) : (
            <div className="grid gap-3 md:grid-cols-3">
              {salasAbertas.map((sala) => (
                <button
                  key={sala.id}
                  onClick={() => setCodigo(sala.codigo)}
                  className="group rounded-2xl border border-white/[0.08] bg-white/[0.025] p-4 text-left transition hover:-translate-y-0.5 hover:border-violet-300/35 hover:bg-violet-400/[0.06]"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="truncate text-sm font-bold text-white/85">{sala.nome}</span>
                    <span className="flex h-2 w-2 shrink-0 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,.7)]" />
                  </div>
                  <div className="mt-5 flex items-center justify-between">
                    <span className="font-mono text-xs tracking-[0.18em] text-violet-200">{sala.codigo}</span>
                    <span className="flex items-center gap-1 text-[11px] text-white/30"><Users size={12} /> {sala._count?.jogadores ?? 0}/{sala.maxJogadores}</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </section>

        <div className="mt-6 grid gap-5 lg:grid-cols-[1.35fr_1fr]">
          <div className={`${glassCard} rounded-[2rem] p-6 sm:p-7`}>
            <div className="flex items-center justify-between gap-5">
              <div>
                <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-2xl bg-white/[0.06] text-white/70"><Tags size={21} /></div>
                <h2 className="text-xl font-black tracking-tight">Banco de perguntas</h2>
                <p className="mt-2 max-w-md text-sm leading-6 text-white/35">Conteúdo disponível para criar rodadas mais variadas e desafiadoras.</p>
              </div>
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-fuchsia-300/15 bg-fuchsia-400/[0.07]">
                <span className="text-2xl font-black text-fuchsia-200">{loadingPerguntas ? "—" : perguntas.length}</span>
              </div>
            </div>
          </div>

          <button
            onClick={() => router.push("/perfil")}
            className="group relative overflow-hidden rounded-[2rem] border border-amber-300/15 bg-gradient-to-br from-amber-400/10 via-[#18151b] to-[#11111c] p-6 text-left transition hover:-translate-y-1 hover:border-amber-300/35 sm:p-7"
          >
            <div className="absolute -right-10 -top-10 h-36 w-36 rounded-full bg-amber-400/10 blur-[55px]" />

            <div className="relative">
              <div className="flex items-start justify-between">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-400/10 text-amber-200">
                  <Trophy size={21} />
                </div>

                <Shield size={18} className="text-amber-200/30" />
              </div>

              <p className="mt-6 text-[10px] font-bold uppercase tracking-[0.2em] text-white/30">
                Sua patente
              </p>

              <h2 className="mt-1 text-xl font-black">
                {loadingUsuario
                  ? "Carregando..."
                  : usuario?.patente?.nome ?? "Sem classificação"}
              </h2>

              {!loadingUsuario && usuario?.patente && (
                <>
                  <div className="mt-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-amber-300" />

                      <span className="text-xs font-semibold text-amber-200">
                        {usuario.pontuacao.toLocaleString("pt-BR")} pontos
                      </span>
                    </div>

                    <span className="text-[10px] font-semibold text-white/30">
                      {usuario.patente.pontos.toLocaleString("pt-BR")} pts
                    </span>
                  </div>

                  {/* Barra */}
                  <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-white/10">
                    <div
                      className="h-full rounded-full bg-amber-300 transition-all duration-500"
                      style={{
                        width: `${Math.min(
                          (usuario.pontuacao / usuario.patente.pontos) * 100,
                          100
                        )}%`,
                      }}
                    />
                  </div>
                </>
              )}
            </div>
          </button>
        </div>
      </section>
    </main>
  );
}
