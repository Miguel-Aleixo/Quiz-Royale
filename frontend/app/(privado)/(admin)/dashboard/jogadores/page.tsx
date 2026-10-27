
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Search,
  Users,
  Shield,
  ShieldCheck,
  ShieldOff,
  User,
  ChevronLeft,
  ChevronRight,
  X,
  AlertTriangle,
  LoaderCircle,
  Check,
} from "lucide-react";
import Cookies from "js-cookie";
import { toast } from "sonner";

import Header from "@/app/components/dashboard/Header";
import LoadingOverlay from "@/app/components/global/Loading";

type Role = "ADMIN" | "JOGADOR";

type Usuario = {
  id: number;
  nome: string;
  email: string;
  role: Role;
  patenteId: number | null;
  patente?: {
    id: number;
    nome: string;
  } | null;
};

const LIMITE_BUSCA = 100;
const USUARIOS_POR_PAGINA = 10;

function obterIdDoToken(token: string): number | null {
  try {
    const partes = token.split(".");
    if (partes.length !== 3) return null;

    const payload = JSON.parse(
      atob(partes[1].replace(/-/g, "+").replace(/_/g, "/"))
    );

    const id = Number(payload.sub ?? payload.id ?? payload.usuarioId);

    return Number.isInteger(id) && id > 0 ? id : null;
  } catch {
    return null;
  }
}

function mensagemErro(data: any, padrao: string): string {
  if (Array.isArray(data?.message)) {
    return data.message.join(", ");
  }

  return typeof data?.message === "string" ? data.message : padrao;
}

export default function UsuariosPage() {
  const API = process.env.NEXT_PUBLIC_API;

  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [busca, setBusca] = useState("");
  const [pagina, setPagina] = useState(1);

  const [loading, setLoading] = useState(true);
  const [alterandoRoleId, setAlterandoRoleId] = useState<number | null>(null);
  const [usuarioSelecionado, setUsuarioSelecionado] =
    useState<Usuario | null>(null);

  const [confirmando, setConfirmando] = useState(false);

  const buscarUsuarios = useCallback(async () => {
    const tokenAtual = Cookies.get("token");

    if (!tokenAtual) {
      toast.error("Sessão não encontrada. Faça login novamente.");
      setLoading(false);
      return;
    }

    if (!API) {
      toast.error("A API não está configurada.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      const res = await fetch(`${API}/usuario`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${tokenAtual}`,
          "Content-Type": "application/json",
        },
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(
          mensagemErro(data, "Não foi possível buscar os usuários.")
        );
      }

      if (!Array.isArray(data)) {
        throw new Error("A resposta da API possui um formato inválido.");
      }

      const meuId = obterIdDoToken(tokenAtual);

      // Remove o próprio usuário da listagem.
      const lista = data.filter(
        (usuario: Usuario) => meuId === null || usuario.id !== meuId
      );

      setUsuarios(lista);
    } catch (error) {
      console.error("Erro ao buscar usuários:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Não foi possível conectar ao servidor."
      );
    } finally {
      setLoading(false);
    }
  }, [API]);

  useEffect(() => {
    void buscarUsuarios();
  }, [buscarUsuarios]);

  const usuariosFiltrados = useMemo(() => {
    const termo = busca.trim().toLocaleLowerCase("pt-BR");

    if (!termo) return usuarios;

    return usuarios.filter((usuario) => {
      return (
        usuario.nome.toLocaleLowerCase("pt-BR").includes(termo) ||
        usuario.email.toLocaleLowerCase("pt-BR").includes(termo) ||
        usuario.role.toLocaleLowerCase("pt-BR").includes(termo) ||
        (usuario.patente?.nome ?? "")
          .toLocaleLowerCase("pt-BR")
          .includes(termo)
      );
    });
  }, [usuarios, busca]);

  const totalPaginas = Math.max(
    1,
    Math.ceil(usuariosFiltrados.length / USUARIOS_POR_PAGINA)
  );

  const usuariosPaginados = useMemo(() => {
    const inicio = (pagina - 1) * USUARIOS_POR_PAGINA;

    return usuariosFiltrados.slice(
      inicio,
      inicio + USUARIOS_POR_PAGINA
    );
  }, [usuariosFiltrados, pagina]);

  useEffect(() => {
    setPagina((atual) => Math.min(atual, totalPaginas));
  }, [totalPaginas]);

  const administradores = usuarios.filter(
    (usuario) => usuario.role === "ADMIN"
  ).length;

  const jogadores = usuarios.filter(
    (usuario) => usuario.role === "JOGADOR"
  ).length;

  const novoRole: Role | null = usuarioSelecionado
    ? usuarioSelecionado.role === "ADMIN"
      ? "JOGADOR"
      : "ADMIN"
    : null;

  const alterarPermissao = async () => {
    if (!usuarioSelecionado || !novoRole) return;

    const tokenAtual = Cookies.get("token");

    if (!tokenAtual) {
      toast.error("Sessão não encontrada. Faça login novamente.");
      setUsuarioSelecionado(null);
      return;
    }

    if (!API) {
      toast.error("A API não está configurada.");
      return;
    }

    try {
      setConfirmando(true);
      setAlterandoRoleId(usuarioSelecionado.id);

      const res = await fetch(
        `${API}/usuario/${usuarioSelecionado.id}/role`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${tokenAtual}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ role: novoRole }),
        }
      );

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(
          mensagemErro(
            data,
            "Não foi possível alterar a função do usuário."
          )
        );
      }

      setUsuarios((atuais) =>
        atuais.map((usuario) =>
          usuario.id === usuarioSelecionado.id
            ? { ...usuario, role: novoRole }
            : usuario
        )
      );

      toast.success(
        novoRole === "ADMIN"
          ? `${usuarioSelecionado.nome} agora é administrador.`
          : `Permissão de administrador removida de ${usuarioSelecionado.nome}.`
      );

      setUsuarioSelecionado(null);
    } catch (error) {
      console.error("Erro ao alterar função:", error);

      toast.error(
        error instanceof Error
          ? error.message
          : "Não foi possível conectar ao servidor."
      );
    } finally {
      setConfirmando(false);
      setAlterandoRoleId(null);
    }
  };

  const intervaloInicio =
    usuariosFiltrados.length === 0
      ? 0
      : (pagina - 1) * USUARIOS_POR_PAGINA + 1;

  const intervaloFim = Math.min(
    pagina * USUARIOS_POR_PAGINA,
    usuariosFiltrados.length
  );

  return (
    <main className="min-h-screen bg-[#080812] text-white">
      <LoadingOverlay show={loading} message="Carregando usuários..." />
      <Header />

      <div className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">
        <div className="mb-8 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-purple-400/15 bg-purple-500/10 text-purple-300">
            <Users size={23} />
          </div>

          <div>
            <h1 className="text-2xl font-black tracking-tight">
              Usuários
            </h1>
            <p className="mt-1 text-sm text-white/40">
              Consulte os jogadores e gerencie as permissões.
            </p>
          </div>
        </div>

        <div className="mb-6 grid gap-4 sm:grid-cols-3">
          <StatCard
            label="Usuários listados"
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

        <section className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.025]">
          <div className="flex flex-col gap-4 border-b border-white/10 p-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="font-bold">Gerenciar usuários</h2>
              <p className="mt-1 text-xs text-white/40">
                {usuariosFiltrados.length} resultado(s) encontrado(s)
              </p>
            </div>

            <div className="w-full lg:max-w-sm">
              <div className="relative">
                <Search
                  size={17}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-white/35"
                />

                <input
                  value={busca}
                  maxLength={LIMITE_BUSCA}
                  onChange={(event) => {
                    setBusca(event.target.value);
                    setPagina(1);
                  }}
                  placeholder="Buscar por nome, e-mail, tipo ou patente..."
                  aria-label="Buscar usuários"
                  className="h-11 w-full rounded-xl border border-white/10 bg-[#0d0d1b] pl-10 pr-4 text-sm outline-none transition placeholder:text-white/25 focus:border-purple-400/50 focus:ring-2 focus:ring-purple-500/10"
                />
              </div>
            </div>
          </div>

          <div className="divide-y divide-white/[0.06]">
            {!loading && usuariosPaginados.length === 0 ? (
              <div className="px-5 py-16 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white/[0.04] text-white/30">
                  <Users size={27} />
                </div>
                <h3 className="mt-4 text-sm font-bold text-white/70">
                  Nenhum usuário encontrado
                </h3>
                <p className="mt-1 text-xs text-white/35">
                  Tente outro termo de busca.
                </p>
              </div>
            ) : (
              usuariosPaginados.map((usuario) => (
                <article
                  key={usuario.id}
                  className="flex flex-col gap-4 p-5 transition-colors hover:bg-white/[0.025] lg:flex-row lg:items-center lg:justify-between"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div
                      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
                        usuario.role === "ADMIN"
                          ? "bg-purple-500/15 text-purple-300"
                          : "bg-white/[0.06] text-white/50"
                      }`}
                    >
                      {usuario.role === "ADMIN" ? (
                        <ShieldCheck size={20} />
                      ) : (
                        <User size={20} />
                      )}
                    </div>

                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-white/90">
                        {usuario.nome}
                      </p>
                      <p className="mt-1 break-all text-xs text-white/40">
                        {usuario.email}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-bold ${
                        usuario.role === "ADMIN"
                          ? "border-purple-400/20 bg-purple-500/10 text-purple-300"
                          : "border-white/10 bg-white/[0.03] text-white/55"
                      }`}
                    >
                      {usuario.role === "ADMIN" ? (
                        <ShieldCheck size={14} />
                      ) : (
                        <User size={14} />
                      )}
                      {usuario.role === "ADMIN" ? "Administrador" : "Jogador"}
                    </span>

                    <span className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-white/50">
                      {usuario.patente?.nome ?? "Sem patente"}
                    </span>

                    <button
                      type="button"
                      onClick={() => setUsuarioSelecionado(usuario)}
                      disabled={alterandoRoleId !== null}
                      className={`inline-flex cursor-pointer min-h-10 items-center justify-center gap-2 rounded-xl border px-3 py-2 text-xs font-bold transition disabled:cursor-not-allowed disabled:opacity-50 ${
                        usuario.role === "ADMIN"
                          ? "border-red-400/20 bg-red-500/10 text-red-300 hover:bg-red-500/20"
                          : "border-purple-400/20 bg-purple-500/10 text-purple-300 hover:bg-purple-500/20"
                      }`}
                    >
                      {usuario.role === "ADMIN" ? (
                        <ShieldOff size={15} />
                      ) : (
                        <ShieldCheck size={15} />
                      )}

                      {usuario.role === "ADMIN"
                        ? "Remover admin"
                        : "Tornar admin"}
                    </button>
                  </div>
                </article>
              ))
            )}
          </div>

          <div className="flex flex-col gap-3 border-t border-white/10 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-white/40">
              Mostrando{" "}
              <span className="font-semibold text-white/70">
                {intervaloInicio}–{intervaloFim}
              </span>{" "}
              de{" "}
              <span className="font-semibold text-white/70">
                {usuariosFiltrados.length}
              </span>{" "}
              usuários
            </p>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPagina((atual) => Math.max(1, atual - 1))}
                disabled={pagina <= 1 || loading}
                aria-label="Página anterior"
                className="flex cursor-pointer h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/[0.03] text-white/70 transition hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-30"
              >
                <ChevronLeft size={17} />
              </button>

              <span className="min-w-24 text-center text-xs text-white/50">
                Página{" "}
                <strong className="text-white">{pagina}</strong> de{" "}
                <strong className="text-white">{totalPaginas}</strong>
              </span>

              <button
                type="button"
                onClick={() =>
                  setPagina((atual) => Math.min(totalPaginas, atual + 1))
                }
                disabled={pagina >= totalPaginas || loading}
                aria-label="Próxima página"
                className="flex cursor-pointer h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/[0.03] text-white/70 transition hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-30"
              >
                <ChevronRight size={17} />
              </button>
            </div>
          </div>
        </section>
      </div>

      {/* MODAL DE CONFIRMAÇÃO */}
      {usuarioSelecionado && novoRole && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (
              event.target === event.currentTarget &&
              !confirmando
            ) {
              setUsuarioSelecionado(null);
            }
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-role-titulo"
            className="w-full max-w-md overflow-hidden rounded-2xl border border-white/10 bg-[#10101d] shadow-2xl shadow-black/50"
          >
            <div className="flex items-start justify-between border-b border-white/[0.08] p-5">
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-11 w-11 items-center justify-center rounded-xl ${
                    novoRole === "ADMIN"
                      ? "bg-purple-500/15 text-purple-300"
                      : "bg-red-500/10 text-red-300"
                  }`}
                >
                  {novoRole === "ADMIN" ? (
                    <ShieldCheck size={21} />
                  ) : (
                    <AlertTriangle size={21} />
                  )}
                </div>

                <div>
                  <h2
                    id="modal-role-titulo"
                    className="font-bold text-white"
                  >
                    {novoRole === "ADMIN"
                      ? "Promover a administrador"
                      : "Remover administrador"}
                  </h2>
                  <p className="mt-1 text-xs text-white/40">
                    Confirme a alteração de permissão.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setUsuarioSelecionado(null)}
                disabled={confirmando}
                aria-label="Fechar modal"
                className="rounded-lg cursor-pointer p-2 text-white/40 transition hover:bg-white/[0.06] hover:text-white disabled:opacity-30"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-5">
              <p className="text-sm leading-6 text-white/65">
                {novoRole === "ADMIN" ? (
                  <>
                    Você está prestes a conceder permissões administrativas
                    para{" "}
                    <strong className="text-white">
                      {usuarioSelecionado.nome}
                    </strong>
                    .
                  </>
                ) : (
                  <>
                    Você está prestes a retirar as permissões administrativas
                    de{" "}
                    <strong className="text-white">
                      {usuarioSelecionado.nome}
                    </strong>
                    .
                  </>
                )}
              </p>

              <div className="mt-4 flex items-center gap-3 rounded-xl border border-white/[0.08] bg-white/[0.025] p-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/[0.06] text-white/60">
                  <User size={18} />
                </div>

                <div className="min-w-0">
                  <p className="truncate text-sm font-bold">
                    {usuarioSelecionado.nome}
                  </p>
                  <p className="break-all text-xs text-white/40">
                    {usuarioSelecionado.email}
                  </p>
                </div>
              </div>

              <p className="mt-4 text-xs leading-5 text-white/35">
                {novoRole === "ADMIN"
                  ? "Administradores podem acessar recursos restritos do painel. Conceda essa permissão apenas a pessoas confiáveis."
                  : "O usuário perderá o acesso às funções exclusivas de administrador."}
              </p>

              <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => setUsuarioSelecionado(null)}
                  disabled={confirmando}
                  className="inline-flex cursor-pointer h-10 items-center justify-center rounded-xl border border-white/10 px-4 text-sm font-semibold text-white/65 transition hover:bg-white/[0.05] disabled:opacity-40"
                >
                  Cancelar
                </button>

                <button
                  type="button"
                  onClick={alterarPermissao}
                  disabled={confirmando}
                  className={`inline-flex cursor-pointer h-10 items-center justify-center gap-2 rounded-xl px-4 text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-60 ${
                    novoRole === "ADMIN"
                      ? "bg-purple-500 text-white hover:bg-purple-400"
                      : "bg-red-500/90 text-white hover:bg-red-500"
                  }`}
                >
                  {confirmando ? (
                    <LoaderCircle size={16} className="animate-spin" />
                  ) : (
                    <Check size={16} />
                  )}

                  {confirmando
                    ? "Salvando..."
                    : novoRole === "ADMIN"
                      ? "Confirmar promoção"
                      : "Confirmar remoção"}
                </button>
              </div>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}

function StatCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-5">
      <div className="flex items-center justify-between">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/10 text-purple-300">
          {icon}
        </div>

        <span className="text-2xl font-black tabular-nums">{value}</span>
      </div>

      <p className="mt-5 text-xs text-white/40">{label}</p>
    </div>
  );
}
