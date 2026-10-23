"use client";

import { useEffect, useMemo, useState } from "react";
import {
  BookOpenText,
  Check,
  ChevronLeft,
  ChevronRight,
  Edit3,
  MoreHorizontal,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";
import Cookies from "js-cookie";
import { toast } from "sonner";

import Header from "@/app/components/dashboard/Header";
import LoadingOverlay from "@/app/components/global/Loading";

type Tema = { id: number; nome: string };
type Alternativa = { id?: number; texto: string; correta: boolean };
type Pergunta = {
  id: number;
  enunciado: string;
  temaId: number;
  tema?: Tema;
  alternativas: Alternativa[];
};
type FormPergunta = {
  enunciado: string;
  temaId: number;
  alternativas: Alternativa[];
};

const MAX_ENUNCIADO = 500;
const MAX_ALTERNATIVA = 200;
const ITENS_POR_PAGINA = 8;

const alternativasVazias = (): Alternativa[] => [
  { texto: "", correta: true },
  { texto: "", correta: false },
  { texto: "", correta: false },
  { texto: "", correta: false },
];

export default function PerguntasPage() {
  const API = process.env.NEXT_PUBLIC_API;
  const [perguntas, setPerguntas] = useState<Pergunta[]>([]);
  const [temas, setTemas] = useState<Tema[]>([]);
  const [busca, setBusca] = useState("");
  const [filtroTema, setFiltroTema] = useState("todos");
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [modalAberto, setModalAberto] = useState(false);
  const [menuAberto, setMenuAberto] = useState<number | null>(null);
  const [perguntaEditando, setPerguntaEditando] = useState<Pergunta | null>(null);
  const [perguntaParaExcluir, setPerguntaParaExcluir] = useState<Pergunta | null>(null);
  const [form, setForm] = useState<FormPergunta>({
    enunciado: "",
    temaId: 0,
    alternativas: alternativasVazias(),
  });
  const [loading, setLoading] = useState(false);
  const [excluindo, setExcluindo] = useState(false);

  const headers = (token: string) => ({
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  });

  const lerResposta = async (res: Response) => {
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      const mensagem = Array.isArray(data?.message)
        ? data.message.join(", ")
        : data?.message;
      throw new Error(mensagem || "Não foi possível concluir a operação.");
    }
    return data;
  };

  const buscarDados = async () => {
    if (!API) {
      toast.error("API não configurada.");
      return;
    }

    const token = Cookies.get("token");
    if (!token) {
      toast.error("Sessão não encontrada. Faça login novamente.");
      return;
    }

    try {
      setLoading(true);
      const [perguntasRes, temasRes] = await Promise.all([
        fetch(`${API}/pergunta`, { headers: headers(token) }),
        fetch(`${API}/tema`, { headers: headers(token) }),
      ]);
      const [perguntasData, temasData] = await Promise.all([
        lerResposta(perguntasRes),
        lerResposta(temasRes),
      ]);
      setPerguntas(Array.isArray(perguntasData) ? perguntasData : []);
      setTemas(Array.isArray(temasData) ? temasData : []);
    } catch (error) {
      console.error("Erro ao buscar perguntas:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Não foi possível conectar ao servidor.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void buscarDados();
  }, []);

  const perguntasFiltradas = useMemo(() => {
    const termo = busca.trim().toLocaleLowerCase("pt-BR");

    return perguntas.filter((p) => {
      const nomeTema =
        p.tema?.nome ??
        temas.find((t) => t.id === p.temaId)?.nome ??
        "";
      const correspondeBusca =
        !termo ||
        p.enunciado.toLocaleLowerCase("pt-BR").includes(termo) ||
        String(p.id).includes(termo) ||
        nomeTema.toLocaleLowerCase("pt-BR").includes(termo);
      const correspondeTema =
        filtroTema === "todos" || String(p.temaId) === filtroTema;

      return correspondeBusca && correspondeTema;
    });
  }, [perguntas, busca, filtroTema, temas]);

  const totalPaginas = Math.max(
    1,
    Math.ceil(perguntasFiltradas.length / ITENS_POR_PAGINA),
  );
  const paginaSegura = Math.min(paginaAtual, totalPaginas);
  const perguntasPaginadas = perguntasFiltradas.slice(
    (paginaSegura - 1) * ITENS_POR_PAGINA,
    paginaSegura * ITENS_POR_PAGINA,
  );

  const abrirCriacao = () => {
    setPerguntaEditando(null);
    setForm({
      enunciado: "",
      temaId: temas[0]?.id ?? 0,
      alternativas: alternativasVazias(),
    });
    setMenuAberto(null);
    setModalAberto(true);
  };

  const abrirEdicao = (pergunta: Pergunta) => {
    const alternativas = [...(pergunta.alternativas ?? [])]
      .sort((a, b) => Number(b.correta) - Number(a.correta))
      .map((a) => ({ ...a }));

    while (alternativas.length < 4) {
      alternativas.push({ texto: "", correta: false });
    }

    setPerguntaEditando(pergunta);
    setForm({
      enunciado: pergunta.enunciado,
      temaId: pergunta.temaId,
      alternativas: alternativas.slice(0, 4),
    });
    setMenuAberto(null);
    setModalAberto(true);
  };

  const fecharModal = () => {
    setModalAberto(false);
    setPerguntaEditando(null);
    setForm({
      enunciado: "",
      temaId: temas[0]?.id ?? 0,
      alternativas: alternativasVazias(),
    });
  };

  const alterarAlternativa = (
    index: number,
    campo: "texto" | "correta",
    valor: string | boolean,
  ) => {
    setForm((atual) => ({
      ...atual,
      alternativas: atual.alternativas.map((alternativa, i) => {
        if (campo === "texto") {
          return i === index
            ? { ...alternativa, texto: String(valor) }
            : alternativa;
        }
        return { ...alternativa, correta: i === index };
      }),
    }));
  };

  const validar = () => {
    if (!form.enunciado.trim()) {
      toast.error("Digite o enunciado da pergunta.");
      return false;
    }
    if (form.enunciado.trim().length > MAX_ENUNCIADO) {
      toast.error(`O enunciado deve ter no máximo ${MAX_ENUNCIADO} caracteres.`);
      return false;
    }
    if (!form.temaId) {
      toast.error("Selecione um tema.");
      return false;
    }
    if (form.alternativas.length !== 4) {
      toast.error("A pergunta deve ter exatamente quatro alternativas.");
      return false;
    }
    if (form.alternativas.some((a) => !a.texto.trim())) {
      toast.error("Preencha as quatro alternativas.");
      return false;
    }
    if (form.alternativas.some((a) => a.texto.trim().length > MAX_ALTERNATIVA)) {
      toast.error(
        `Cada alternativa deve ter no máximo ${MAX_ALTERNATIVA} caracteres.`,
      );
      return false;
    }
    if (form.alternativas.filter((a) => a.correta).length !== 1) {
      toast.error("Marque exatamente uma alternativa correta.");
      return false;
    }
    return true;
  };

  const salvar = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!validar()) return;

    if (!API) {
      toast.error("API não configurada.");
      return;
    }
    const token = Cookies.get("token");
    if (!token) {
      toast.error("Sessão não encontrada. Faça login novamente.");
      return;
    }

    try {
      setLoading(true);

      if (!perguntaEditando) {
        const criada = await lerResposta(
          await fetch(`${API}/pergunta`, {
            method: "POST",
            headers: headers(token),
            body: JSON.stringify({
              enunciado: form.enunciado.trim(),
              temaId: Number(form.temaId),
            }),
          }),
        );

        for (const alternativa of form.alternativas) {
          await lerResposta(
            await fetch(`${API}/alternativa`, {
              method: "POST",
              headers: headers(token),
              body: JSON.stringify({
                texto: alternativa.texto.trim(),
                correta: alternativa.correta,
                perguntaId: criada.id,
              }),
            }),
          );
        }

        toast.success("Pergunta cadastrada com sucesso!");
      } else {
        const perguntaId = perguntaEditando.id;

        await lerResposta(
          await fetch(`${API}/pergunta/${perguntaId}`, {
            method: "PATCH",
            headers: headers(token),
            body: JSON.stringify({
              enunciado: form.enunciado.trim(),
              temaId: Number(form.temaId),
            }),
          }),
        );

        const antigas = perguntaEditando.alternativas ?? [];
        const idsMantidos = new Set(
          form.alternativas
            .map((alternativa) => alternativa.id)
            .filter((id): id is number => typeof id === "number"),
        );

        // Atualiza alternativas existentes e cria as que ainda não possuem ID.
        for (const alternativa of form.alternativas) {
          const payload = {
            texto: alternativa.texto.trim(),
            correta: alternativa.correta,
            perguntaId,
          };

          if (alternativa.id !== undefined) {
            await lerResposta(
              await fetch(`${API}/alternativa/${alternativa.id}`, {
                method: "PATCH",
                headers: headers(token),
                body: JSON.stringify(payload),
              }),
            );
          } else {
            await lerResposta(
              await fetch(`${API}/alternativa`, {
                method: "POST",
                headers: headers(token),
                body: JSON.stringify(payload),
              }),
            );
          }
        }

        // Exclui alternativas antigas que não estão mais no formulário.
        const removidas = antigas.filter(
          (alternativa) =>
            alternativa.id !== undefined && !idsMantidos.has(alternativa.id),
        );

        for (const alternativa of removidas) {
          await lerResposta(
            await fetch(`${API}/alternativa/${alternativa.id}`, {
              method: "DELETE",
              headers: headers(token),
            }),
          );
        }

        toast.success("Pergunta atualizada com sucesso!");
      }

      fecharModal();
      await buscarDados();
    } catch (error) {
      console.error("Erro ao salvar pergunta:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Não foi possível salvar a pergunta.",
      );
      await buscarDados();
    } finally {
      setLoading(false);
    }
  };

  const excluirPergunta = async () => {
    if (!perguntaParaExcluir || !API) return;

    const token = Cookies.get("token");
    if (!token) {
      toast.error("Sessão não encontrada. Faça login novamente.");
      return;
    }

    try {
      setExcluindo(true);
      await lerResposta(
        await fetch(`${API}/pergunta/${perguntaParaExcluir.id}`, {
          method: "DELETE",
          headers: headers(token),
        }),
      );
      setPerguntaParaExcluir(null);
      setMenuAberto(null);
      toast.success("Pergunta excluída com sucesso!");
      await buscarDados();
    } catch (error) {
      console.error("Erro ao excluir pergunta:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Não foi possível excluir a pergunta. Ela pode estar vinculada a uma rodada.",
      );
    } finally {
      setExcluindo(false);
    }
  };

  const totalAlternativas = perguntas.reduce(
    (total, pergunta) => total + (pergunta.alternativas?.length ?? 0),
    0,
  );

  const temaNome = (pergunta: Pergunta) =>
    pergunta.tema?.nome ??
    temas.find((tema) => tema.id === pergunta.temaId)?.nome ??
    "Tema não informado";

  return (
    <main className="min-h-screen bg-[#080812] text-white">
      <LoadingOverlay show={loading} message="Processando..." />

      {perguntaParaExcluir && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl border border-white/10 bg-[#0d0d18] p-6 shadow-2xl">
            <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-red-500/10">
              <Trash2 className="h-6 w-6 text-red-400" />
            </div>
            <h2 className="text-lg font-bold">Excluir pergunta?</h2>
            <p className="mt-2 text-sm leading-6 text-white/50">
              Tem certeza que deseja excluir esta pergunta?
            </p>
            <p className="mt-3 line-clamp-3 text-sm text-white/80">
              “{perguntaParaExcluir.enunciado}”
            </p>
            <p className="mt-3 text-xs text-red-400/80">
              Se estiver vinculada a uma rodada, a API pode impedir a exclusão.
            </p>
            <div className="mt-7 flex gap-3">
              <button
                type="button"
                onClick={() => setPerguntaParaExcluir(null)}
                disabled={excluindo}
                className="flex-1 cursor-pointer rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm font-semibold text-white/70 transition hover:bg-white/[0.07] disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={excluirPergunta}
                disabled={excluindo}
                className="flex-1 cursor-pointer rounded-xl bg-red-500 px-4 py-3 text-sm font-bold text-white transition hover:bg-red-400 disabled:opacity-50"
              >
                {excluindo ? "Excluindo..." : "Excluir"}
              </button>
            </div>
          </div>
        </div>
      )}

      <Header />

      <div className="mx-auto max-w-7xl p-6 lg:p-8">
        <div className="mb-8 flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-500/10 text-purple-400">
              <BookOpenText size={23} />
            </div>
            <div>
              <h2 className="text-2xl font-black">Cadastro de perguntas</h2>
              <p className="mt-1 text-sm text-white/30">
                Crie, edite e gerencie as perguntas disponíveis no Quiz Royale.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={abrirCriacao}
            className="flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-purple-500 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-purple-500/20 transition hover:bg-purple-400"
          >
            <Plus size={18} /> Nova pergunta
          </button>
        </div>

        <div className="mb-6 grid gap-4 sm:grid-cols-3">
          <StatCard
            label="Total de perguntas"
            value={perguntas.length}
            icon={<BookOpenText size={19} />}
          />
          <StatCard
            label="Resultados encontrados"
            value={perguntasFiltradas.length}
            icon={<Search size={19} />}
          />
          <StatCard
            label="Alternativas cadastradas"
            value={totalAlternativas}
            icon={<Check size={19} />}
          />
        </div>

        <section className="rounded-2xl border border-white/10 bg-white/[0.025]">
          <div className="flex flex-col gap-4 border-b border-white/5 p-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h3 className="font-bold">Todas as perguntas</h3>
              <p className="mt-1 text-xs text-white/25">
                {perguntasFiltradas.length} pergunta(s) encontrada(s)
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="relative">
                <Search
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-white/25"
                />
                <input
                  value={busca}
                  maxLength={30}
                  onChange={(event) => {
                    setBusca(event.target.value);
                    setPaginaAtual(1);
                  }}
                  placeholder="Buscar por enunciado, ID ou tema..."
                  className="h-10 w-full rounded-xl border border-white/10 bg-white/[0.04] pl-9 pr-4 text-sm outline-none placeholder:text-white/20 focus:border-purple-400/50 sm:w-72"
                />
              </div>
              <select
                value={filtroTema}
                onChange={(event) => {
                  setFiltroTema(event.target.value);
                  setPaginaAtual(1);
                }}
                className="h-10 rounded-xl border border-white/10 bg-[#11111d] px-3 text-sm text-white/70 outline-none focus:border-purple-400/50"
              >
                <option value="todos">Todos os temas</option>
                {temas.map((tema) => (
                  <option key={tema.id} value={tema.id}>
                    {tema.nome}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="divide-y divide-white/5">
            {loading && perguntas.length === 0 ? (
              <div className="p-10 text-center">
                <div className="mx-auto h-7 w-7 animate-spin rounded-full border-2 border-white/10 border-t-purple-400" />
                <p className="mt-3 text-sm text-white/40">
                  Carregando perguntas...
                </p>
              </div>
            ) : perguntasFiltradas.length === 0 ? (
              <div className="p-10 text-center">
                <BookOpenText className="mx-auto text-white/20" size={32} />
                <p className="mt-3 text-sm font-bold text-white/50">
                  Nenhuma pergunta encontrada
                </p>
                <p className="mt-1 text-xs text-white/25">
                  Tente alterar sua busca ou cadastrar uma nova pergunta.
                </p>
              </div>
            ) : (
              perguntasPaginadas.map((pergunta) => (
                <div
                  key={pergunta.id}
                  className="flex flex-col gap-4 p-5 transition hover:bg-white/[0.02] sm:flex-row sm:items-start sm:justify-between"
                >
                  <div className="flex min-w-0 items-start gap-4">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-purple-500/10 text-purple-400">
                      <BookOpenText size={19} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-purple-400">
                        Pergunta #{pergunta.id} · {temaNome(pergunta)}
                      </p>
                      <p className="mt-2 whitespace-pre-wrap text-sm font-semibold leading-6 text-white/90">
                        {pergunta.enunciado}
                      </p>
                      <div className="mt-3 grid gap-2 sm:grid-cols-2">
                        {(pergunta.alternativas ?? []).map((alternativa, index) => (
                          <div
                            key={alternativa.id ?? `${pergunta.id}-${index}`}
                            className={`flex items-start gap-2 rounded-lg border px-3 py-2 text-xs ${
                              alternativa.correta
                                ? "border-emerald-400/20 bg-emerald-500/[0.06] text-emerald-200"
                                : "border-white/5 bg-white/[0.02] text-white/45"
                            }`}
                          >
                            <span className="font-black">
                              {String.fromCharCode(65 + index)}.
                            </span>
                            <span className="min-w-0 flex-1">
                              {alternativa.texto}
                            </span>
                            {alternativa.correta && (
                              <Check size={14} className="shrink-0" />
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-end">
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() =>
                          setMenuAberto((atual) =>
                            atual === pergunta.id ? null : pergunta.id,
                          )
                        }
                        className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg text-white/30 transition hover:bg-white/5 hover:text-white"
                        aria-label={`Abrir opções da pergunta ${pergunta.id}`}
                      >
                        <MoreHorizontal size={18} />
                      </button>
                      {menuAberto === pergunta.id && (
                        <div className="absolute right-0 top-11 z-30 w-44 rounded-xl border border-white/10 bg-[#12121e] p-2 shadow-2xl">
                          <button
                            type="button"
                            onClick={() => abrirEdicao(pergunta)}
                            className="flex w-full cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm text-white/60 transition hover:bg-white/5 hover:text-white"
                          >
                            <Edit3 size={15} /> Editar
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setPerguntaParaExcluir(pergunta);
                              setMenuAberto(null);
                            }}
                            className="flex w-full cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm text-red-400 transition hover:bg-red-500/5"
                          >
                            <Trash2 size={15} /> Excluir
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {perguntasFiltradas.length > ITENS_POR_PAGINA && (
            <div className="flex flex-col gap-3 border-t border-white/5 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-white/35">
                Mostrando{" "}
                {(paginaSegura - 1) * ITENS_POR_PAGINA + 1}–{" "}
                {Math.min(
                  paginaSegura * ITENS_POR_PAGINA,
                  perguntasFiltradas.length,
                )}{" "}
                de {perguntasFiltradas.length}
              </p>
              <div className="flex flex-wrap items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setPaginaAtual((pagina) => Math.max(1, pagina - 1))}
                  disabled={paginaSegura === 1}
                  className="flex h-9 items-center gap-1 rounded-lg border border-white/10 px-3 text-sm text-white/60 transition hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-30"
                >
                  <ChevronLeft size={16} /> Anterior
                </button>
                {Array.from({ length: totalPaginas }, (_, index) => index + 1).map(
                  (pagina) => (
                    <button
                      type="button"
                      key={pagina}
                      onClick={() => setPaginaAtual(pagina)}
                      aria-current={paginaSegura === pagina ? "page" : undefined}
                      className={`h-9 min-w-9 rounded-lg px-3 text-sm transition ${
                        paginaSegura === pagina
                          ? "bg-purple-500 font-bold text-white"
                          : "border border-white/10 text-white/55 hover:bg-white/5"
                      }`}
                    >
                      {pagina}
                    </button>
                  ),
                )}
                <button
                  type="button"
                  onClick={() =>
                    setPaginaAtual((pagina) => Math.min(totalPaginas, pagina + 1))
                  }
                  disabled={paginaSegura === totalPaginas}
                  className="flex h-9 items-center gap-1 rounded-lg border border-white/10 px-3 text-sm text-white/60 transition hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-30"
                >
                  Próxima <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </section>
      </div>

      {modalAberto && (
        <div
          className="fixed inset-0 z-[110] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) fecharModal();
          }}
        >
          <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-white/10 bg-[#12121e] shadow-2xl">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-white/5 bg-[#12121e] p-6">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-purple-400">
                  {perguntaEditando ? "Edição" : "Cadastro"}
                </p>
                <h3 className="mt-1 text-xl font-black">
                  {perguntaEditando ? "Editar pergunta" : "Nova pergunta"}
                </h3>
              </div>
              <button
                type="button"
                onClick={fecharModal}
                className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg text-white/30 transition hover:bg-white/5 hover:text-white"
                aria-label="Fechar formulário"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={salvar}>
              <div className="space-y-5 p-6">
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <label htmlFor="enunciado" className="text-xs font-bold text-white/60">
                      Enunciado
                    </label>
                    <span className={`text-[10px] ${form.enunciado.length > MAX_ENUNCIADO ? "text-red-400" : "text-white/30"}`}>
                      {form.enunciado.length}/{MAX_ENUNCIADO}
                    </span>
                  </div>
                  <textarea
                    id="enunciado"
                    required
                    autoFocus
                    rows={3}
                    maxLength={MAX_ENUNCIADO}
                    value={form.enunciado}
                    onChange={(event) =>
                      setForm((atual) => ({
                        ...atual,
                        enunciado: event.target.value,
                      }))
                    }
                    placeholder="Digite o enunciado da pergunta..."
                    className="w-full resize-y rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm outline-none placeholder:text-white/20 focus:border-purple-400/60"
                  />
                </div>

                <div>
                  <label htmlFor="tema" className="mb-2 block text-xs font-bold text-white/60">
                    Tema
                  </label>
                  <select
                    id="tema"
                    required
                    value={form.temaId}
                    onChange={(event) =>
                      setForm((atual) => ({
                        ...atual,
                        temaId: Number(event.target.value),
                      }))
                    }
                    className="h-12 w-full rounded-xl border border-white/10 bg-[#171725] px-4 text-sm outline-none focus:border-purple-400/60"
                  >
                    <option value={0}>Selecione um tema</option>
                    {temas.map((tema) => (
                      <option key={tema.id} value={tema.id}>
                        {tema.nome}
                      </option>
                    ))}
                  </select>
                  {temas.length === 0 && (
                    <p className="mt-2 text-xs text-amber-300/80">
                      Cadastre pelo menos um tema antes de criar perguntas.
                    </p>
                  )}
                </div>

                <div>
                  <div className="mb-3 flex items-center justify-between">
                    <label className="text-xs font-bold text-white/60">
                      Alternativas
                    </label>
                    <span className="text-[10px] text-white/25">
                      Selecione a resposta correta
                    </span>
                  </div>
                  <div className="space-y-3">
                    {form.alternativas.map((alternativa, index) => (
                      <div
                        key={alternativa.id ?? `nova-${index}`}
                        className={`rounded-xl border p-2 ${
                          alternativa.correta
                            ? "border-emerald-400/30 bg-emerald-500/[0.06]"
                            : "border-white/10 bg-white/[0.02]"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() =>
                              alterarAlternativa(index, "correta", true)
                            }
                            aria-label={`Marcar alternativa ${String.fromCharCode(65 + index)} como correta`}
                            aria-pressed={alternativa.correta}
                            className={`flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-lg border text-xs font-black ${
                              alternativa.correta
                                ? "border-emerald-400/40 bg-emerald-500/15 text-emerald-300"
                                : "border-white/10 bg-white/[0.03] text-white/35 hover:text-white"
                            }`}
                          >
                            {alternativa.correta ? (
                              <Check size={15} />
                            ) : (
                              String.fromCharCode(65 + index)
                            )}
                          </button>
                          <input
                            required
                            maxLength={MAX_ALTERNATIVA}
                            value={alternativa.texto}
                            onChange={(event) =>
                              alterarAlternativa(index, "texto", event.target.value)
                            }
                            placeholder={`Alternativa ${String.fromCharCode(65 + index)}`}
                            className="h-10 min-w-0 flex-1 bg-transparent px-1 text-sm outline-none placeholder:text-white/20"
                          />
                          <span className="hidden pr-2 text-[10px] text-white/25 sm:block">
                            {alternativa.texto.length}/{MAX_ALTERNATIVA}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex flex-col-reverse gap-3 border-t border-white/5 p-6 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={fecharModal}
                  className="h-11 cursor-pointer rounded-xl border border-white/10 px-5 text-sm font-semibold text-white/50 transition hover:bg-white/5 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={
                    !form.enunciado.trim() ||
                    form.enunciado.trim().length > MAX_ENUNCIADO ||
                    !form.temaId ||
                    form.alternativas.some(
                      (a) =>
                        !a.texto.trim() ||
                        a.texto.trim().length > MAX_ALTERNATIVA,
                    ) ||
                    form.alternativas.filter((a) => a.correta).length !== 1 ||
                    loading
                  }
                  className="h-11 cursor-pointer rounded-xl bg-purple-500 px-5 text-sm font-bold text-white transition hover:bg-purple-400 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {perguntaEditando ? "Salvar alterações" : "Cadastrar pergunta"}
                </button>
              </div>
            </form>
          </div>
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
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/10 text-purple-400">
          {icon}
        </div>
        <span className="text-2xl font-black">
          {value.toLocaleString("pt-BR")}
        </span>
      </div>
      <p className="mt-5 text-xs text-white/30">{label}</p>
    </div>
  );
}
