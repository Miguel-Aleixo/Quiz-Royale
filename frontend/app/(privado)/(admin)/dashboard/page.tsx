"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Activity,
  CheckCircle2,
  Crown,
  Gamepad2,
  HelpCircle,
  Lock,
  Shield,
  Tags,
  Trophy,
  UserRound,
  Users,
} from "lucide-react";
import Header from "@/app/components/dashboard/Header";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface Usuario {
  id: number;
  nome: string;
  email: string;
  role: "ADMIN" | "JOGADOR";
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
}

interface Tema {
  id: number;
  nome: string;
}

interface Patente {
  id: number;
  nome: string;
  pontos: number;
}

export default function DashboardPage() {
  const API = process.env.NEXT_PUBLIC_API;

  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [salas, setSalas] = useState<Sala[]>([]);
  const [perguntas, setPerguntas] = useState<Pergunta[]>([]);
  const [temas, setTemas] = useState<Tema[]>([]);
  const [patentes, setPatentes] = useState<Patente[]>([]);

  const router = useRouter();

  const [loading, setLoading] = useState(true);

  // =========================================================
  // TOKEN
  // =========================================================

  function getToken() {
    return document.cookie
      .split("; ")
      .find((row) => row.startsWith("token="))
      ?.split("=")[1];
  }

  // =========================================================
  // CARREGAR DASHBOARD
  // =========================================================

  async function carregarDashboard() {
    try {
      setLoading(true);

      const token = getToken();

      if (!token) {
        toast.error("Sessão não encontrada. Faça login novamente.");
        router.push("/login");
        return;
      }

      if (!API) {
        toast.error("API não configurada.");
        return;
      }

      const headers = {
        Authorization: `Bearer ${token}`,
      };

      const [
        usuariosResponse,
        salasResponse,
        perguntasResponse,
        temasResponse,
        patentesResponse,
      ] = await Promise.all([
        fetch(`${API}/usuario`, { headers }),
        fetch(`${API}/sala`, { headers }),
        fetch(`${API}/pergunta`, { headers }),
        fetch(`${API}/tema`, { headers }),
        fetch(`${API}/patente`, { headers }),
      ]);

      // Verifica se alguma requisição falhou
      if (!usuariosResponse.ok) {
        const data = await usuariosResponse.json();

        const mensagem = Array.isArray(data.message)
          ? data.message.join(", ")
          : data.message || "Erro ao carregar usuários.";

        toast.error(mensagem);
        return;
      }

      if (!salasResponse.ok) {
        const data = await salasResponse.json();

        const mensagem = Array.isArray(data.message)
          ? data.message.join(", ")
          : data.message || "Erro ao carregar salas.";

        toast.error(mensagem);
        return;
      }

      if (!perguntasResponse.ok) {
        const data = await perguntasResponse.json();

        const mensagem = Array.isArray(data.message)
          ? data.message.join(", ")
          : data.message || "Erro ao carregar perguntas.";

        toast.error(mensagem);
        return;
      }

      if (!temasResponse.ok) {
        const data = await temasResponse.json();

        const mensagem = Array.isArray(data.message)
          ? data.message.join(", ")
          : data.message || "Erro ao carregar temas.";

        toast.error(mensagem);
        return;
      }

      if (!patentesResponse.ok) {
        const data = await patentesResponse.json();

        const mensagem = Array.isArray(data.message)
          ? data.message.join(", ")
          : data.message || "Erro ao carregar patentes.";

        toast.error(mensagem);
        return;
      }

      const [
        usuariosData,
        salasData,
        perguntasData,
        temasData,
        patentesData,
      ] = await Promise.all([
        usuariosResponse.json(),
        salasResponse.json(),
        perguntasResponse.json(),
        temasResponse.json(),
        patentesResponse.json(),
      ]);

      setUsuarios(usuariosData);
      setSalas(salasData);
      setPerguntas(perguntasData);
      setTemas(temasData);
      setPatentes(patentesData);
    } catch (error) {
      console.error("Erro ao carregar dashboard:", error);

      toast.error("Não foi possível conectar ao servidor.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    carregarDashboard();
  }, []);

  // =========================================================
  // ESTATÍSTICAS
  // =========================================================

  const totalUsuarios = usuarios.length;

  const totalAdmins = usuarios.filter(
    (usuario) => usuario.role === "ADMIN"
  ).length;

  const totalJogadores = usuarios.filter(
    (usuario) => usuario.role === "JOGADOR"
  ).length;

  const totalSalas = salas.length;

  const salasAbertas = salas.filter(
    (sala) => sala.status.toLowerCase() === "aberta"
  ).length;

  const salasEmAndamento = salas.filter(
    (sala) => sala.status.toLowerCase() === "em andamento"
  ).length;

  const salasFinalizadas = salas.filter(
    (sala) => sala.status.toLowerCase() === "finalizada"
  ).length;

  const jogadoresEmSalas = salas.reduce(
    (total, sala) => total + (sala._count?.jogadores ?? 0),
    0
  );

  // =========================================================
  // ÚLTIMAS SALAS
  // =========================================================

  const ultimasSalas = useMemo(() => {
    return [...salas]
      .sort((a, b) => b.id - a.id)
      .slice(0, 5);
  }, [salas]);

  // =========================================================
  // PATENTES
  // =========================================================

  const usuariosPorPatente = useMemo(() => {
    return [...patentes]
      .sort((a, b) => a.pontos - b.pontos)
      .map((patente) => {
        const quantidade = usuarios.filter(
          (usuario) => usuario.patente?.id === patente.id
        ).length;

        return {
          id: patente.id,
          nome: patente.nome,
          pontos: patente.pontos,
          quantidade,
        };
      });
  }, [patentes, usuarios]);

  // =========================================================
  // LOADING
  // =========================================================

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#080812]">
        <div className="flex flex-col items-center">
          <div className="relative h-11 w-11">
            <div className="absolute inset-0 rounded-full border-2 border-white/10" />

            <div className="absolute inset-0 animate-spin rounded-full border-2 border-transparent border-t-violet-500 border-r-fuchsia-500" />
          </div>

          <p className="mt-4 text-sm text-white/40">
            Carregando dashboard...
          </p>
        </div>
      </main>
    );
  }

  // =========================================================
  // DASHBOARD
  // =========================================================

  return (
    <main className="min-h-screen bg-[#080812] text-white">

      <Header />

      <div className="mx-auto max-w-7xlpx-4 py-6 sm:px-6 lg:px-8">


        {/* ================================================= */}
        {/* HEADER */}
        {/* ================================================= */}

        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3">

            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-violet-400/20 bg-violet-500/10">
              <Activity className="h-5 w-5 text-violet-400" />
            </div>

            <div>
              <h1 className="text-2xl font-bold tracking-tight">
                Visão geral
              </h1>

              <p className="mt-1 text-sm text-white/40">
                Acompanhe os principais dados do Quiz Royale.
              </p>
            </div>

          </div>
        </motion.div>

        {/* ================================================= */}
        {/* CARDS PRINCIPAIS */}
        {/* ================================================= */}

        <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">

          <DashboardCard
            icon={<Users className="h-5 w-5" />}
            title="Usuários"
            value={totalUsuarios}
            description={`${totalJogadores} jogadores cadastrados`}
          />

          <DashboardCard
            icon={<HelpCircle className="h-5 w-5" />}
            title="Perguntas"
            value={perguntas.length}
            description="Perguntas cadastradas"
          />

          <DashboardCard
            icon={<Gamepad2 className="h-5 w-5" />}
            title="Salas"
            value={totalSalas}
            description={`${salasAbertas} salas abertas`}
          />

          <DashboardCard
            icon={<Tags className="h-5 w-5" />}
            title="Temas"
            value={temas.length}
            description="Temas cadastrados"
          />

        </div>

        {/* ================================================= */}
        {/* CARDS SECUNDÁRIOS */}
        {/* ================================================= */}

        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">

          <SmallCard
            icon={<Shield className="h-4 w-4" />}
            title="Administradores"
            value={totalAdmins}
          />

          <SmallCard
            icon={<UserRound className="h-4 w-4" />}
            title="Jogadores"
            value={totalJogadores}
          />

          <SmallCard
            icon={<Crown className="h-4 w-4" />}
            title="Patentes"
            value={patentes.length}
          />

          <SmallCard
            icon={<Trophy className="h-4 w-4" />}
            title="Partidas finalizadas"
            value={salasFinalizadas}
          />

        </div>

        {/* ================================================= */}
        {/* SALAS + STATUS */}
        {/* ================================================= */}

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">

          {/* ================================================= */}
          {/* ÚLTIMAS SALAS */}
          {/* ================================================= */}

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.025] lg:col-span-2"
          >

            <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">

              <div>
                <h2 className="text-sm font-semibold">
                  Últimas salas
                </h2>

                <p className="mt-1 text-xs text-white/30">
                  Salas criadas recentemente
                </p>
              </div>

              <Gamepad2 className="h-5 w-5 text-white/20" />

            </div>

            {ultimasSalas.length === 0 ? (
              <div className="flex h-52 items-center justify-center">
                <div className="text-center">

                  <Gamepad2 className="mx-auto mb-3 h-7 w-7 text-white/15" />

                  <p className="text-sm text-white/40">
                    Nenhuma sala criada
                  </p>

                </div>
              </div>
            ) : (
              <div className="divide-y divide-white/5">

                {ultimasSalas.map((sala, index) => (
                  <motion.div
                    key={sala.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{
                      delay: 0.15 + index * 0.05,
                    }}
                    className="flex items-center justify-between px-5 py-4 transition hover:bg-white/[0.025]"
                  >

                    <div className="flex min-w-0 items-center gap-3">

                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-violet-400/15 bg-violet-500/10">
                        <Gamepad2 className="h-4 w-4 text-violet-400" />
                      </div>

                      <div className="min-w-0">

                        <p className="truncate text-sm font-semibold">
                          {sala.nome}
                        </p>

                        <div className="mt-1 flex items-center gap-2">

                          <span className="font-mono text-[10px] tracking-wider text-white/30">
                            {sala.codigo}
                          </span>

                          <span className="text-white/10">
                            •
                          </span>

                          <span className="text-[10px] text-white/30">
                            {sala._count?.jogadores ?? 0}/
                            {sala.maxJogadores} jogadores
                          </span>

                        </div>

                      </div>

                    </div>

                    <StatusBadge status={sala.status} />

                  </motion.div>
                ))}

              </div>
            )}

          </motion.div>

          {/* ================================================= */}
          {/* STATUS DAS PARTIDAS */}
          {/* ================================================= */}

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="rounded-2xl border border-white/10 bg-white/[0.025]"
          >

            <div className="border-b border-white/10 px-5 py-4">

              <h2 className="text-sm font-semibold">
                Status das partidas
              </h2>

              <p className="mt-1 text-xs text-white/30">
                Situação atual das salas
              </p>

            </div>

            <div className="space-y-5 p-5">

              <StatusRow
                icon={<CheckCircle2 className="h-4 w-4" />}
                title="Salas abertas"
                value={salasAbertas}
                percentage={
                  totalSalas > 0
                    ? (salasAbertas / totalSalas) * 100
                    : 0
                }
              />

              <StatusRow
                icon={<Activity className="h-4 w-4" />}
                title="Em andamento"
                value={salasEmAndamento}
                percentage={
                  totalSalas > 0
                    ? (salasEmAndamento / totalSalas) * 100
                    : 0
                }
              />

              <StatusRow
                icon={<Trophy className="h-4 w-4" />}
                title="Finalizadas"
                value={salasFinalizadas}
                percentage={
                  totalSalas > 0
                    ? (salasFinalizadas / totalSalas) * 100
                    : 0
                }
              />

              <StatusRow
                icon={<Lock className="h-4 w-4" />}
                title="Outros"
                value={
                  totalSalas -
                  salasAbertas -
                  salasEmAndamento -
                  salasFinalizadas
                }
                percentage={
                  totalSalas > 0
                    ? (
                      (totalSalas -
                        salasAbertas -
                        salasEmAndamento -
                        salasFinalizadas) /
                      totalSalas
                    ) * 100
                    : 0
                }
              />

            </div>

          </motion.div>

        </div>

        {/* ================================================= */}
        {/* PATENTES */}
        {/* ================================================= */}

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-5 rounded-2xl border border-white/10 bg-white/[0.025]"
        >

          <div className="border-b border-white/10 px-5 py-4">

            <div className="flex items-center gap-3">

              <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-yellow-400/15 bg-yellow-500/10">
                <Crown className="h-4 w-4 text-yellow-400" />
              </div>

              <div>
                <h2 className="text-sm font-semibold">
                  Jogadores por patente
                </h2>

                <p className="mt-1 text-xs text-white/30">
                  Distribuição dos jogadores entre as patentes
                </p>
              </div>

            </div>

          </div>

          {usuariosPorPatente.length === 0 ? (
            <div className="px-5 py-10 text-center text-sm text-white/30">
              Nenhuma patente cadastrada.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2 lg:grid-cols-4">

              {usuariosPorPatente.map((patente) => {

                const totalDistribuicao = usuariosPorPatente.reduce(
                  (total, item) => total + item.quantidade,
                  0
                );

                const percentual =
                  totalDistribuicao > 0
                    ? (patente.quantidade / totalDistribuicao) * 100
                    : 0;

                return (
                  <div
                    key={patente.id}
                    className="rounded-xl border border-white/10 bg-white/[0.02] p-4"
                  >

                    <div className="mb-3 flex items-center justify-between">

                      <span className="text-sm font-semibold">
                        {patente.nome}
                      </span>

                      <Crown className="h-4 w-4 text-yellow-400/60" />

                    </div>

                    <div className="mb-2 flex items-end justify-between">

                      <span className="text-2xl font-bold">
                        {patente.quantidade}
                      </span>

                      <span className="text-xs text-white/30">
                        {percentual.toFixed(0)}%
                      </span>

                    </div>

                    <div className="h-1.5 overflow-hidden rounded-full bg-white/5">

                      <motion.div
                        initial={{ width: 0 }}
                        animate={{
                          width: `${Math.min(percentual, 100)}%`,
                        }}
                        transition={{ duration: 0.7 }}
                        className="h-full rounded-full bg-violet-500"
                      />

                    </div>

                  </div>
                );
              })}

            </div>
          )}

        </motion.div>

      </div>
    </main>
  );
}

// =========================================================
// DASHBOARD CARD
// =========================================================

function DashboardCard({
  icon,
  title,
  value,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  value: number;
  description: string;
}) {
  return (
    <motion.div
      whileHover={{ y: -2 }}
      className="rounded-2xl border border-white/10 bg-white/[0.025] p-5"
    >

      <div className="mb-4 flex items-center justify-between">

        <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-violet-400/15 bg-violet-500/10 text-violet-400">
          {icon}
        </div>

        <Activity className="h-4 w-4 text-white/10" />

      </div>

      <p className="text-xs text-white/35">
        {title}
      </p>

      <p className="mt-1 text-2xl font-bold tracking-tight">
        {value}
      </p>

      <p className="mt-2 text-[11px] text-white/25">
        {description}
      </p>

    </motion.div>
  );
}

// =========================================================
// SMALL CARD
// =========================================================

function SmallCard({
  icon,
  title,
  value,
}: {
  icon: React.ReactNode;
  title: string;
  value: number;
}) {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.025] p-4">

      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white/40">
        {icon}
      </div>

      <div>

        <p className="text-[11px] text-white/30">
          {title}
        </p>

        <p className="mt-0.5 text-lg font-bold">
          {value}
        </p>

      </div>

    </div>
  );
}

// =========================================================
// STATUS BADGE
// =========================================================

function StatusBadge({
  status,
}: {
  status: string;
}) {
  const normalized = status.toLowerCase();

  let style =
    "border-white/10 bg-white/5 text-white/40";

  if (normalized === "aberta") {
    style =
      "border-emerald-400/20 bg-emerald-400/10 text-emerald-300";
  }

  if (normalized === "em andamento") {
    style =
      "border-violet-400/20 bg-violet-400/10 text-violet-300";
  }

  if (normalized === "finalizada") {
    style =
      "border-blue-400/20 bg-blue-400/10 text-blue-300";
  }

  return (
    <span
      className={`shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-semibold ${style}`}
    >
      {status}
    </span>
  );
}

// =========================================================
// STATUS ROW
// =========================================================

function StatusRow({
  icon,
  title,
  value,
  percentage,
}: {
  icon: React.ReactNode;
  title: string;
  value: number;
  percentage: number;
}) {
  return (
    <div>

      <div className="mb-2 flex items-center justify-between">

        <div className="flex items-center gap-2">

          <span className="text-white/30">
            {icon}
          </span>

          <span className="text-xs text-white/50">
            {title}
          </span>

        </div>

        <span className="text-sm font-semibold">
          {value}
        </span>

      </div>

      <div className="h-1.5 overflow-hidden rounded-full bg-white/5">

        <motion.div
          initial={{ width: 0 }}
          animate={{
            width: `${Math.min(
              Math.max(percentage, 0),
              100
            )}%`,
          }}
          transition={{ duration: 0.7 }}
          className="h-full rounded-full bg-violet-500"
        />

      </div>

    </div>
  );
}