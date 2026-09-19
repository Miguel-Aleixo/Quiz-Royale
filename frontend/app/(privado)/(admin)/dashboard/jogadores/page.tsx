"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Search,
  Users,
  Shield,
  User,
} from "lucide-react";
import Cookies from "js-cookie";
import Header from "@/app/components/dashboard/Header";
import LoadingOverlay from "@/app/components/global/Loading";
import { toast } from "sonner";

type Usuario = {
  id: number;
  nome: string;
  email: string;
  role: "ADMIN" | "JOGADOR";
  patenteId: number | null;
  patente?: {
    id: number;
    nome: string;
  } | null;
};

export default function UsuariosPage() {
  const API = process.env.NEXT_PUBLIC_API;

  const token = Cookies.get("token");

  const [usuarios, setUsuarios] = useState<Usuario[]>([]);

  const [busca, setBusca] = useState("");

  const [loading, setLoading] = useState(false);

  /*
   * ============================
   * BUSCAR USUÁRIOS
   * ============================
   */

  const buscarUsuarios = async () => {
    try {
      setLoading(true);

      const tokenAtual = Cookies.get("token");

      if (!tokenAtual) {
        toast.error("Sessão não encontrada. Faça login novamente.");
        return;
      }

      if (!API) {
        toast.error("API não configurada.");
        return;
      }

      const res = await fetch(`${API}/usuario`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${tokenAtual}`,
        },
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        const mensagem = Array.isArray(data?.message)
          ? data.message.join(", ")
          : data?.message || "Erro ao buscar usuários.";

        toast.error(mensagem);
        return;
      }

      setUsuarios(data);
    } catch (error) {
      console.error("Erro ao buscar usuários:", error);
      toast.error("Não foi possível conectar ao servidor.");
    } finally {
      setLoading(false);
    }
  };

  /*
   * Busca os usuários quando a página abre
   */

  useEffect(() => {
    buscarUsuarios();
  }, []);

  /*
   * ============================
   * FILTRAR USUÁRIOS
   * ============================
   */

  const usuariosFiltrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();

    if (!termo) {
      return usuarios;
    }

    return usuarios.filter((usuario) => {
      const correspondeNome = usuario.nome
        .toLowerCase()
        .includes(termo);

      const correspondeEmail = usuario.email
        .toLowerCase()
        .includes(termo);

      const correspondeId = usuario.id
        .toString()
        .includes(termo);

      const correspondeRole = usuario.role
        .toLowerCase()
        .includes(termo);

      const correspondePatente =
        usuario.patente?.nome
          .toLowerCase()
          .includes(termo) ?? false;

      return (
        correspondeNome ||
        correspondeEmail ||
        correspondeId ||
        correspondeRole ||
        correspondePatente
      );
    });
  }, [usuarios, busca]);

  /*
   * ============================
   * CONTADORES
   * ============================
   */

  const administradores = usuarios.filter(
    (usuario) => usuario.role === "ADMIN"
  ).length;

  const jogadores = usuarios.filter(
    (usuario) => usuario.role === "JOGADOR"
  ).length;

  return (
    <main className="min-h-screen bg-[#080812] text-white">

      <LoadingOverlay
        show={loading}
        message="Carregando..."
      />

      {/* =========================
            HEADER
        ========================= */}

      <Header />

      {/* =========================
            CONTEÚDO
        ========================= */}

      <div className="mx-auto max-w-7xl p-6 lg:p-8">

        {/* TÍTULO */}

        <div className="mb-8">

          <div className="flex items-center gap-3">

            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-500/10 text-purple-400">
              <Users size={23} />
            </div>

            <div>

              <h2 className="text-2xl font-black">
                Usuários
              </h2>

              <p className="mt-1 text-sm text-white/30">
                Visualize e consulte os usuários cadastrados.
              </p>

            </div>

          </div>

        </div>

        {/* =========================
                ESTATÍSTICAS
            ========================= */}

        <div className="mb-6 grid gap-4 sm:grid-cols-3">

          <StatCard
            label="Total de usuários"
            value={usuarios.length}
            icon={<Users size={19} />}
          />

          <StatCard
            label="Jogadores"
            value={jogadores}
            icon={<User size={19} />}
          />

          <StatCard
            label="Administradores"
            value={administradores}
            icon={<Shield size={19} />}
          />

        </div>

        {/* =========================
                LISTAGEM
            ========================= */}

        <section className="rounded-2xl border border-white/10 bg-white/[0.025]">

          {/* CABEÇALHO */}

          <div className="flex flex-col gap-4 border-b border-white/5 p-5 lg:flex-row lg:items-center lg:justify-between">

            <div>

              <h3 className="font-bold">
                Todos os usuários
              </h3>

              <p className="mt-1 text-xs text-white/25">
                {usuariosFiltrados.length} usuário(s) encontrado(s)
              </p>

            </div>

            {/* BUSCA */}

            <div className="relative">

              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-white/25"
              />

              <input
                value={busca}
                onChange={(event) =>
                  setBusca(event.target.value)
                }
                placeholder="Buscar por nome, e-mail ou ID..."
                className="h-10 w-full rounded-xl border border-white/10 bg-white/[0.04] pl-9 pr-4 text-sm text-white outline-none placeholder:text-white/20 focus:border-purple-400/50 sm:w-72"
              />

            </div>

          </div>

          {/* =========================
                    USUÁRIOS
                ========================= */}

          <div className="divide-y divide-white/5">

            {loading ? (

              <div className="p-10 text-center">

                <div className="mx-auto h-7 w-7 animate-spin rounded-full border-2 border-white/10 border-t-purple-400" />

                <p className="mt-3 text-sm text-white/40">
                  Carregando usuários...
                </p>

              </div>

            ) : usuariosFiltrados.length === 0 ? (

              <div className="p-10 text-center">

                <Users
                  className="mx-auto text-white/20"
                  size={32}
                />

                <p className="mt-3 text-sm font-bold text-white/50">
                  Nenhum usuário encontrado
                </p>

                <p className="mt-1 text-xs text-white/25">
                  Tente alterar os termos da sua busca.
                </p>

              </div>

            ) : (

              usuariosFiltrados.map((usuario) => (

                <div
                  key={usuario.id}
                  className="flex flex-col gap-4 p-5 transition hover:bg-white/[0.02] lg:flex-row lg:items-center lg:justify-between"
                >

                  {/* INFORMAÇÕES */}

                  <div className="flex min-w-0 items-center gap-4">

                    {/* AVATAR */}

                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-purple-500/10 text-purple-400">
                      <User size={19} />
                    </div>

                    {/* NOME / EMAIL */}

                    <div className="min-w-0">

                      <p className="truncate text-sm font-bold">
                        {usuario.nome}
                      </p>

                      <p className="mt-1 truncate text-xs text-white/30">
                        {usuario.email}
                      </p>

                    </div>

                  </div>

                  {/* DADOS */}

                  <div className="flex flex-wrap items-center gap-3 lg:justify-end">

                    {/* ID */}

                    <div className="rounded-lg border border-white/5 bg-white/[0.02] px-3 py-2">
                      <p className="text-[9px] font-bold uppercase tracking-widest text-white/20">
                        ID
                      </p>

                      <p className="mt-0.5 text-xs font-bold text-white/50">
                        #{usuario.id}
                      </p>
                    </div>

                    {/* ROLE */}

                    <div
                      className={`rounded-lg border px-3 py-2 ${usuario.role === "ADMIN"
                        ? "border-purple-400/20 bg-purple-500/10"
                        : "border-white/5 bg-white/[0.02]"
                        }`}
                    >
                      <p className="text-[9px] font-bold uppercase tracking-widest text-white/20">
                        Tipo
                      </p>

                      <p
                        className={`mt-0.5 text-xs font-bold ${usuario.role === "ADMIN"
                          ? "text-purple-400"
                          : "text-white/50"
                          }`}
                      >
                        {usuario.role}
                      </p>
                    </div>

                    {/* PATENTE */}

                    <div className="rounded-lg border border-white/5 bg-white/[0.02] px-3 py-2">
                      <p className="text-[9px] font-bold uppercase tracking-widest text-white/20">
                        Patente
                      </p>

                      <p className="mt-0.5 text-xs font-bold text-white/50">
                        {usuario.patente?.nome ?? "Sem patente"}
                      </p>
                    </div>

                  </div>

                </div>

              ))

            )}

          </div>

        </section>

      </div>

    </main>
  );

}

/*

* ============================
* CARD DE ESTATÍSTICA
* ============================
  */

function StatCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
}) {
  return (<div className="rounded-2xl border border-white/10 bg-white/[0.025] p-5">

    <div className="flex items-center justify-between">

      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/10 text-purple-400">
        {icon}
      </div>

      <span className="text-2xl font-black">
        {value}
      </span>

    </div>

    <p className="mt-5 text-xs text-white/30">
      {label}
    </p>

  </div>
  );

}
