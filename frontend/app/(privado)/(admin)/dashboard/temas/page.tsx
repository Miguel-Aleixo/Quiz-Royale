"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Edit3,
  MoreHorizontal,
  Plus,
  Search,
  Trash2,
  X,
  Tags,
} from "lucide-react";
import Cookies from "js-cookie";
import Header from "@/app/components/dashboard/Header";
import LoadingOverlay from "@/app/components/global/Loading";

type Tema = {
  id: number;
  nome: string;
};

type FormTema = {
  nome: string;
};

const temaInicial: FormTema = {
  nome: "",
};

export default function TemasPage() {
  const API = process.env.NEXT_PUBLIC_API;

  const token = Cookies.get("token");

  const [temas, setTemas] = useState<Tema[]>([]);

  const [busca, setBusca] = useState("");

  const [modalAberto, setModalAberto] = useState(false);

  const [menuAberto, setMenuAberto] = useState<number | null>(null);

  const [temaEditando, setTemaEditando] =
    useState<Tema | null>(null);

  const [form, setForm] = useState<FormTema>(temaInicial);

  const [loading, setLoading] = useState(false);

  /*
   * ============================
   * BUSCAR TEMAS
   * ============================
   */

  const buscarTemas = async () => {
    try {
      setLoading(true);

      const res = await fetch(`${API}/tema`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        throw new Error("Erro ao buscar temas");
      }

      const data: Tema[] = await res.json();

      setTemas(data);
    } catch (error) {
      console.error("Erro ao buscar temas:", error);
    } finally {
      setLoading(false);
    }
  };

  /*
   * Busca os temas quando a página abre
   */

  useEffect(() => {
    buscarTemas();
  }, []);

  /*
   * ============================
   * CRIAR TEMA
   * ============================
   */

  const criarTema = async () => {
    setLoading(true);

    try {
      const res = await fetch(`${API}/tema`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          nome: form.nome.trim(),
        }),
      });

      if (!res.ok) {
        throw new Error("Erro ao criar tema");
      }

      fecharModal();

      await buscarTemas();
    } catch (error) {
      console.error("Erro ao criar tema:", error);
    } finally {
      setLoading(false);
    }
  };

  /*
   * ============================
   * EDITAR TEMA
   * ============================
   */

  const editarTema = async () => {
    if (!temaEditando) {
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(
        `${API}/tema/${temaEditando.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            nome: form.nome.trim(),
          }),
        }
      );

      if (!res.ok) {
        throw new Error("Erro ao editar tema");
      }

      fecharModal();

      await buscarTemas();
    } catch (error) {
      console.error("Erro ao editar tema:", error);
    } finally {
      setLoading(false);
    }
  };

  /*
   * ============================
   * EXCLUIR TEMA
   * ============================
   */

  const excluirTema = async (tema: Tema) => {
    const confirmou = window.confirm(
      `Deseja realmente excluir o tema "${tema.nome}"?`
    );

    if (!confirmou) {
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(
        `${API}/tema/${tema.id}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!res.ok) {
        throw new Error("Erro ao excluir tema");
      }

      setMenuAberto(null);

      await buscarTemas();
    } catch (error) {
      console.error("Erro ao excluir tema:", error);
    } finally {
      setLoading(false);
    }
  };

  /*
   * ============================
   * FILTRAR TEMAS
   * ============================
   */

  const temasFiltrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();

    if (!termo) {
      return temas;
    }

    return temas.filter((tema) => {
      const correspondeNome = tema.nome
        .toLowerCase()
        .includes(termo);

      const correspondeId = tema.id
        .toString()
        .includes(termo);

      return correspondeNome || correspondeId;
    });
  }, [temas, busca]);

  /*
   * ============================
   * ABRIR MODAL DE CRIAÇÃO
   * ============================
   */

  function abrirModalCriacao() {
    setTemaEditando(null);

    setForm({
      nome: "",
    });

    setModalAberto(true);

    setMenuAberto(null);
  }

  /*
   * ============================
   * ABRIR MODAL DE EDIÇÃO
   * ============================
   */

  function abrirModalEdicao(tema: Tema) {
    setTemaEditando(tema);

    setForm({
      nome: tema.nome,
    });

    setModalAberto(true);

    setMenuAberto(null);
  }

  /*
   * ============================
   * FECHAR MODAL
   * ============================
   */

  function fecharModal() {
    setModalAberto(false);

    setTemaEditando(null);

    setForm({
      nome: "",
    });
  }

  /*
   * ============================
   * ALTERAR CAMPO
   * ============================
   */

  function atualizarCampo(
    campo: keyof FormTema,
    valor: string
  ) {
    setForm((estadoAtual) => ({
      ...estadoAtual,
      [campo]: valor,
    }));
  }

  /*
   * ============================
   * SALVAR TEMA
   * ============================
   */

  async function salvarTema(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!form.nome.trim()) {
      return;
    }

    if (temaEditando) {
      await editarTema();
      return;
    }

    await criarTema();
  }

  /*
   * ============================
   * MENU DE AÇÕES
   * ============================
   */

  function alternarMenu(id: number) {
    setMenuAberto((menuAtual) =>
      menuAtual === id ? null : id
    );
  }

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

        <div className="mb-8 flex flex-col justify-between gap-5 md:flex-row md:items-end">

          <div>

            <div className="flex items-center gap-3">

              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-500/10 text-purple-400">
                <Tags size={23} />
              </div>

              <div>

                <h2 className="text-2xl font-black">
                  Cadastro de temas
                </h2>

                <p className="mt-1 text-sm text-white/30">
                  Crie, edite e gerencie os temas das partidas.
                </p>

              </div>

            </div>

          </div>

          <button
            type="button"
            onClick={abrirModalCriacao}
            className="flex items-center justify-center gap-2 rounded-xl bg-purple-500 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-purple-500/20 transition hover:bg-purple-400"
          >
            <Plus size={18} />
            Novo tema
          </button>

        </div>

        {/* =========================
                ESTATÍSTICAS
            ========================= */}

        <div className="mb-6 grid gap-4 sm:grid-cols-2">

          <StatCard
            label="Total de temas"
            value={temas.length}
            icon={<Tags size={19} />}
          />

          <StatCard
            label="Resultados encontrados"
            value={temasFiltrados.length}
            icon={<Search size={19} />}
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
                Todos os temas
              </h3>

              <p className="mt-1 text-xs text-white/25">
                {temasFiltrados.length} tema(s) encontrada(s)
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
                placeholder="Buscar por nome ou ID..."
                className="h-10 w-full rounded-xl border border-white/10 bg-white/[0.04] pl-9 pr-4 text-sm text-white outline-none placeholder:text-white/20 focus:border-purple-400/50 sm:w-64"
              />

            </div>

          </div>

          {/* =========================
                    TEMAS
                ========================= */}

          <div className="divide-y divide-white/5">

            {loading ? (

              <div className="p-10 text-center">

                <div className="mx-auto h-7 w-7 animate-spin rounded-full border-2 border-white/10 border-t-purple-400" />

                <p className="mt-3 text-sm text-white/40">
                  Carregando temas...
                </p>

              </div>

            ) : temasFiltrados.length === 0 ? (

              <div className="p-10 text-center">

                <Tags
                  className="mx-auto text-white/20"
                  size={32}
                />

                <p className="mt-3 text-sm font-bold text-white/50">
                  Nenhum tema encontrado
                </p>

                <p className="mt-1 text-xs text-white/25">
                  Tente alterar sua busca ou criar um novo tema.
                </p>

              </div>

            ) : (

              temasFiltrados.map((tema) => (

                <div
                  key={tema.id}
                  className="flex flex-col gap-4 p-5 transition hover:bg-white/[0.02] sm:flex-row sm:items-center sm:justify-between"
                >

                  {/* INFORMAÇÕES */}

                  <div className="flex min-w-0 items-center gap-4">

                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-purple-500/10 text-purple-400">
                      <Tags size={19} />
                    </div>

                    <div className="min-w-0">

                      <p className="truncate text-sm font-bold">
                        {tema.nome}
                      </p>

                      <p className="mt-1 text-[11px] font-bold tracking-widest text-purple-400">
                        ID #{tema.id}
                      </p>

                    </div>

                  </div>

                  {/* AÇÕES */}

                  <div className="flex items-center justify-end">

                    <div className="relative">

                      <button
                        type="button"
                        onClick={() =>
                          alternarMenu(tema.id)
                        }
                        className="flex h-9 w-9 items-center justify-center rounded-lg text-white/30 transition hover:bg-white/5 hover:text-white"
                      >
                        <MoreHorizontal size={18} />
                      </button>

                      {menuAberto === tema.id && (

                        <div className="absolute right-0 top-11 z-50 w-44 rounded-xl border border-white/10 bg-[#12121e] p-2 shadow-2xl">

                          {/* EDITAR */}

                          <button
                            type="button"
                            onClick={() =>
                              abrirModalEdicao(tema)
                            }
                            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-white/60 transition hover:bg-white/5 hover:text-white"
                          >
                            <Edit3 size={15} />
                            Editar
                          </button>

                          {/* EXCLUIR */}

                          <button
                            type="button"
                            onClick={() =>
                              excluirTema(tema)
                            }
                            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-red-400 transition hover:bg-red-500/5"
                          >
                            <Trash2 size={15} />
                            Excluir
                          </button>

                        </div>

                      )}

                    </div>

                  </div>

                </div>

              ))

            )}

          </div>

        </section>

      </div>

      {/* =========================
            MODAL
        ========================= */}

      {modalAberto && (

        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              fecharModal();
            }
          }}
        >

          <div className="w-full max-w-lg overflow-hidden rounded-2xl border border-white/10 bg-[#12121e] shadow-2xl">

            {/* CABEÇALHO */}

            <div className="flex items-center justify-between border-b border-white/5 p-6">

              <div>

                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-purple-400">
                  {temaEditando
                    ? "Edição"
                    : "Cadastro"}
                </p>

                <h3 className="mt-1 text-xl font-black">
                  {temaEditando
                    ? "Editar tema"
                    : "Novo tema"}
                </h3>

              </div>

              <button
                type="button"
                onClick={fecharModal}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-white/30 transition hover:bg-white/5 hover:text-white"
              >
                <X size={18} />
              </button>

            </div>

            {/* FORMULÁRIO */}

            <form onSubmit={salvarTema}>

              <div className="space-y-5 p-6">

                {/* ID */}

                {temaEditando && (

                  <div>

                    <label className="mb-2 block text-xs font-bold text-white/60">
                      ID
                    </label>

                    <input
                      disabled
                      value={temaEditando.id}
                      className="h-12 w-full rounded-xl border border-white/10 bg-white/[0.02] px-4 text-sm text-white/40 outline-none"
                    />

                    <p className="mt-2 text-[11px] text-white/20">
                      O ID não pode ser alterado.
                    </p>

                  </div>

                )}

                {/* NOME */}

                <div>

                  <label className="mb-2 block text-xs font-bold text-white/60">
                    Nome do tema
                  </label>

                  <input
                    required
                    autoFocus
                    value={form.nome}
                    onChange={(event) =>
                      atualizarCampo(
                        "nome",
                        event.target.value
                      )
                    }
                    placeholder="Ex: Conhecimentos Gerais"
                    className="h-12 w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 text-sm text-white outline-none placeholder:text-white/20 focus:border-purple-400/60"
                  />

                </div>

              </div>

              {/* BOTÕES */}

              <div className="flex flex-col-reverse gap-3 border-t border-white/5 p-6 sm:flex-row sm:justify-end">

                <button
                  type="button"
                  onClick={fecharModal}
                  className="h-11 rounded-xl border border-white/10 px-5 text-sm font-semibold text-white/50 transition hover:bg-white/5 hover:text-white"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  className="h-11 rounded-xl bg-purple-500 px-5 text-sm font-bold text-white transition hover:bg-purple-400"
                >
                  {temaEditando
                    ? "Salvar alterações"
                    : "Cadastrar tema"}
                </button>

              </div>

            </form>

          </div>

        </div>

      )}

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
