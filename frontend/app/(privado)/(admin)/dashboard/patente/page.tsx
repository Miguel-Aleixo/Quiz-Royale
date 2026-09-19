"use client";

import { useEffect, useMemo, useState } from "react";
import {
    Crown,
    Edit3,
    MoreHorizontal,
    Plus,
    Search,
    Trash2,
    X,
} from "lucide-react";
import Cookies from "js-cookie";

import Header from "@/app/components/dashboard/Header";
import LoadingOverlay from "@/app/components/global/Loading";
import { toast } from "sonner";

type Patente = {
    id: number;
    nome: string;
    pontos: number;
};

type FormPatente = {
    nome: string;
    pontos: number;
};

export default function PatentesPage() {
    const API = process.env.NEXT_PUBLIC_API;

    const token = Cookies.get("token");

    const [patentes, setPatentes] = useState<Patente[]>([]);

    const [busca, setBusca] = useState("");

    const [modalAberto, setModalAberto] = useState(false);

    const [menuAberto, setMenuAberto] = useState<number | null>(null);

    const [patenteEditando, setPatenteEditando] =
        useState<Patente | null>(null);

    const [form, setForm] = useState<FormPatente>({
        nome: "",
        pontos: 0,
    });

    const [loading, setLoading] = useState(false);

    const [patenteParaExcluir, setPatenteParaExcluir] = useState<Patente | null>(null);
    const [excluindo, setExcluindo] = useState(false);

    /*
 * ============================
 * BUSCAR PATENTES
 * ============================
 */

    const buscarPatentes = async () => {
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

            const res = await fetch(`${API}/patente`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${tokenAtual}`,
                },
            });

            const data = await res.json();

            if (!res.ok) {
                const mensagem = Array.isArray(data.message)
                    ? data.message.join(", ")
                    : data.message || "Erro ao buscar patentes.";

                toast.error(mensagem);
                return;
            }

            setPatentes(data);
        } catch (error) {
            console.error("Erro ao buscar patentes:", error);

            toast.error("Não foi possível conectar ao servidor.");
        } finally {
            setLoading(false);
        }
    };

    /*
     * ============================
     * BUSCAR AO ABRIR A PÁGINA
     * ============================
     */

    useEffect(() => {
        buscarPatentes();
    }, []);

    /*
  * ============================
  * CRIAR PATENTE
  * ============================
  */

    const criarPatente = async () => {
        if (!form.nome.trim()) {
            toast.error("Digite o nome da patente.");
            return;
        }

        if (form.pontos < 0) {
            toast.error("A pontuação não pode ser negativa.");
            return;
        }

        if (!API) {
            toast.error("API não configurada.");
            return;
        }

        const tokenAtual = Cookies.get("token");

        if (!tokenAtual) {
            toast.error("Sessão não encontrada. Faça login novamente.");
            return;
        }

        try {
            setLoading(true);

            const res = await fetch(`${API}/patente`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${tokenAtual}`,
                },
                body: JSON.stringify({
                    nome: form.nome.trim(),
                    pontos: form.pontos,
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                const mensagem = Array.isArray(data.message)
                    ? data.message.join(", ")
                    : data.message || "Erro ao criar patente.";

                toast.error(mensagem);
                return;
            }

            fecharModal();

            toast.success("Patente criada com sucesso!");

            await buscarPatentes();
        } catch (error) {
            console.error("Erro ao criar patente:", error);

            toast.error("Não foi possível conectar ao servidor.");
        } finally {
            setLoading(false);
        }
    };

    /*
 * ============================
 * EDITAR PATENTE
 * ============================
 */

    const editarPatente = async () => {
        if (!patenteEditando) {
            toast.error("Nenhuma patente selecionada.");
            return;
        }

        if (!form.nome.trim()) {
            toast.error("Digite o nome da patente.");
            return;
        }

        if (form.pontos < 0) {
            toast.error("A pontuação não pode ser negativa.");
            return;
        }

        if (!API) {
            toast.error("API não configurada.");
            return;
        }

        const tokenAtual = Cookies.get("token");

        if (!tokenAtual) {
            toast.error("Sessão não encontrada. Faça login novamente.");
            return;
        }

        try {
            setLoading(true);

            const res = await fetch(
                `${API}/patente/${patenteEditando.id}`,
                {
                    method: "PATCH",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${tokenAtual}`,
                    },
                    body: JSON.stringify({
                        nome: form.nome.trim(),
                        pontos: form.pontos,
                    }),
                }
            );

            const data = await res.json();

            if (!res.ok) {
                const mensagem = Array.isArray(data.message)
                    ? data.message.join(", ")
                    : data.message || "Erro ao editar patente.";

                toast.error(mensagem);
                return;
            }

            fecharModal();

            toast.success("Patente atualizada com sucesso!");

            await buscarPatentes();
        } catch (error) {
            console.error("Erro ao editar patente:", error);

            toast.error("Não foi possível conectar ao servidor.");
        } finally {
            setLoading(false);
        }
    };

    /*
  * ============================
  * EXCLUIR PATENTE
  * ============================
  */

    const excluirPatente = async () => {
        if (!patenteParaExcluir) {
            return;
        }

        if (!API) {
            toast.error("API não configurada.");
            return;
        }

        const tokenAtual = Cookies.get("token");

        if (!tokenAtual) {
            toast.error("Sessão não encontrada. Faça login novamente.");
            return;
        }

        try {
            setExcluindo(true);

            const res = await fetch(
                `${API}/patente/${patenteParaExcluir.id}`,
                {
                    method: "DELETE",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${tokenAtual}`,
                    },
                }
            );

            const data = await res.json().catch(() => null);

            if (!res.ok) {
                const mensagem = Array.isArray(data?.message)
                    ? data.message.join(", ")
                    : data?.message || "Erro ao excluir patente.";

                toast.error(mensagem);
                return;
            }

            setMenuAberto(null);
            setPatenteParaExcluir(null);

            toast.success("Patente excluída com sucesso!");

            await buscarPatentes();
        } catch (error) {
            console.error("Erro ao excluir patente:", error);
            toast.error("Não foi possível conectar ao servidor.");
        } finally {
            setExcluindo(false);
        }
    };
    /*
     * ============================
     * FILTRAR PATENTES
     * ============================
     */

    const patentesFiltradas = useMemo(() => {
        const termo = busca.trim().toLowerCase();

        if (!termo) {
            return patentes;
        }

        return patentes.filter((patente) => {
            const correspondeNome = patente.nome
                .toLowerCase()
                .includes(termo);

            const correspondeId = patente.id
                .toString()
                .includes(termo);

            const correspondePontos = patente.pontos
                .toString()
                .includes(termo);

            return (
                correspondeNome ||
                correspondeId ||
                correspondePontos
            );
        });
    }, [patentes, busca]);

    /*
     * ============================
     * ABRIR MODAL DE CRIAÇÃO
     * ============================
     */

    function abrirModalCriacao() {
        setPatenteEditando(null);

        setForm({
            nome: "",
            pontos: 0,
        });

        setModalAberto(true);

        setMenuAberto(null);
    }

    /*
     * ============================
     * ABRIR MODAL DE EDIÇÃO
     * ============================
     */

    function abrirModalEdicao(patente: Patente) {
        setPatenteEditando(patente);

        setForm({
            nome: patente.nome,
            pontos: patente.pontos,
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

        setPatenteEditando(null);

        setForm({
            nome: "",
            pontos: 0,
        });
    }

    /*
     * ============================
     * ALTERAR CAMPO
     * ============================
     */

    function atualizarCampo(
        campo: keyof FormPatente,
        valor: string | number
    ) {
        setForm((estadoAtual) => ({
            ...estadoAtual,
            [campo]: valor,
        }));
    }

    /*
  * ============================
  * SALVAR PATENTE
  * ============================
  */

    async function salvarPatente(
        event: React.FormEvent<HTMLFormElement>
    ) {
        event.preventDefault();

        if (!form.nome.trim()) {
            toast.error("Digite o nome da patente.");
            return;
        }

        if (form.pontos < 0) {
            toast.error("A pontuação não pode ser negativa.");
            return;
        }

        if (patenteEditando) {
            await editarPatente();
            return;
        }

        await criarPatente();
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

    /*
     * ============================
     * MAIOR PATENTE
     * ============================
     */

    const maiorPontuacao = useMemo(() => {
        if (patentes.length === 0) {
            return 0;
        }

        return Math.max(
            ...patentes.map((patente) => patente.pontos)
        );
    }, [patentes]);

    return (
        <main className="min-h-screen bg-[#080812] text-white">

            <LoadingOverlay
                show={loading}
                message="Processando..."
            />

            {patenteParaExcluir && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm">
                    <div className="w-full max-w-md rounded-3xl border border-white/10 bg-[#0d0d18] p-6 shadow-2xl">

                        <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-red-500/10">
                            <Trash2 className="h-6 w-6 text-red-400" />
                        </div>

                        <h2 className="text-lg font-bold text-white">
                            Excluir patente?
                        </h2>

                        <p className="mt-2 text-sm leading-6 text-white/50">
                            Tem certeza que deseja excluir a patente{" "}
                            <span className="font-semibold text-white/80">
                                "{patenteParaExcluir.nome}"
                            </span>
                            ?
                        </p>

                        <p className="mt-3 text-xs text-red-400/80">
                            Essa ação não poderá ser desfeita.
                        </p>

                        <div className="mt-7 flex gap-3">
                            <button
                                type="button"
                                onClick={() => setPatenteParaExcluir(null)}
                                disabled={excluindo}
                                className="cursor-pointer flex-1 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm font-semibold text-white/70 transition hover:bg-white/[0.07] disabled:opacity-50"
                            >
                                Cancelar
                            </button>

                            <button
                                type="button"
                                onClick={excluirPatente}
                                disabled={excluindo}
                                className="cursor-pointer flex-1 rounded-xl bg-red-500 px-4 py-3 text-sm font-bold text-white transition hover:bg-red-400 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {excluindo ? "Excluindo..." : "Excluir"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* =========================
                HEADER
            ========================= */}

            <Header />

            {/* =========================
                CONTEÚDO
            ========================= */}

            <div className="mx-auto max-w-7xl p-6 lg:p-8">

                {/* =========================
                    TÍTULO
                ========================= */}

                <div className="mb-8 flex flex-col justify-between gap-5 md:flex-row md:items-end">

                    <div>

                        <div className="flex items-center gap-3">

                            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-500/10 text-purple-400">
                                <Crown size={23} />
                            </div>

                            <div>

                                <h2 className="text-2xl font-black">
                                    Cadastro de patentes
                                </h2>

                                <p className="mt-1 text-sm text-white/30">
                                    Crie, edite e gerencie as patentes dos jogadores.
                                </p>

                            </div>

                        </div>

                    </div>

                    <button
                        type="button"
                        onClick={abrirModalCriacao}
                        className="cursor-pointer flex items-center justify-center gap-2 rounded-xl bg-purple-500 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-purple-500/20 transition hover:bg-purple-400"
                    >
                        <Plus size={18} />
                        Nova patente
                    </button>

                </div>

                {/* =========================
                    ESTATÍSTICAS
                ========================= */}

                <div className="mb-6 grid gap-4 sm:grid-cols-3">

                    <StatCard
                        label="Total de patentes"
                        value={patentes.length}
                        icon={<Crown size={19} />}
                    />

                    <StatCard
                        label="Resultados encontrados"
                        value={patentesFiltradas.length}
                        icon={<Search size={19} />}
                    />

                    <StatCard
                        label="Maior pontuação"
                        value={maiorPontuacao}
                        icon={<Crown size={19} />}
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
                                Todas as patentes
                            </h3>

                            <p className="mt-1 text-xs text-white/25">
                                {patentesFiltradas.length} patente(s) encontrada(s)
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
                                placeholder="Buscar por nome, ID ou pontos..."
                                className="h-10 w-full rounded-xl border border-white/10 bg-white/[0.04] pl-9 pr-4 text-sm text-white outline-none placeholder:text-white/20 focus:border-purple-400/50 sm:w-72"
                            />

                        </div>

                    </div>

                    {/* =========================
                        PATENTES
                    ========================= */}

                    <div className="divide-y divide-white/5">

                        {loading ? (

                            <div className="p-10 text-center">

                                <div className="mx-auto h-7 w-7 animate-spin rounded-full border-2 border-white/10 border-t-purple-400" />

                                <p className="mt-3 text-sm text-white/40">
                                    Carregando patentes...
                                </p>

                            </div>

                        ) : patentesFiltradas.length === 0 ? (

                            <div className="p-10 text-center">

                                <Crown
                                    className="mx-auto text-white/20"
                                    size={32}
                                />

                                <p className="mt-3 text-sm font-bold text-white/50">
                                    Nenhuma patente encontrada
                                </p>

                                <p className="mt-1 text-xs text-white/25">
                                    Tente alterar sua busca ou criar uma nova patente.
                                </p>

                            </div>

                        ) : (

                            patentesFiltradas.map((patente) => (

                                <div
                                    key={patente.id}
                                    className="flex flex-col gap-4 p-5 transition hover:bg-white/[0.02] sm:flex-row sm:items-center sm:justify-between"
                                >

                                    {/* =========================
                                        INFORMAÇÕES
                                    ========================= */}

                                    <div className="flex min-w-0 items-center gap-4">

                                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-purple-500/10 text-purple-400">
                                            <Crown size={19} />
                                        </div>

                                        <div className="min-w-0">

                                            <p className="truncate text-sm font-bold">
                                                {patente.nome}
                                            </p>

                                            <div className="mt-1 flex flex-wrap items-center gap-3">

                                                <p className="text-[11px] font-bold tracking-widest text-purple-400">
                                                    ID #{patente.id}
                                                </p>

                                                <span className="h-1 w-1 rounded-full bg-white/20" />

                                                <p className="text-[11px] font-bold text-amber-400">
                                                    {patente.pontos.toLocaleString("pt-BR")} pontos
                                                </p>

                                            </div>

                                        </div>

                                    </div>

                                    {/* =========================
                                        AÇÕES
                                    ========================= */}

                                    <div className="flex items-center justify-end">

                                        <div className="relative">

                                            <button
                                                type="button"
                                                onClick={() =>
                                                    alternarMenu(patente.id)
                                                }
                                                className="cursor-pointer flex h-9 w-9 items-center justify-center rounded-lg text-white/30 transition hover:bg-white/5 hover:text-white"
                                            >
                                                <MoreHorizontal size={18} />
                                            </button>

                                            {menuAberto === patente.id && (

                                                <div className="absolute right-0 top-11 z-[100] w-44 rounded-xl border border-white/10 bg-[#12121e] p-2 shadow-2xl">

                                                    {/* EDITAR */}

                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            abrirModalEdicao(patente)
                                                        }
                                                        className="cursor-pointer flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-white/60 transition hover:bg-white/5 hover:text-white"
                                                    >
                                                        <Edit3 size={15} />
                                                        Editar
                                                    </button>

                                                    {/* EXCLUIR */}

                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setPatenteParaExcluir(patente);
                                                            setMenuAberto(null);
                                                        }}
                                                        className="cursor-pointer flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-red-400 transition hover:bg-red-500/5"
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

                        {/* =========================
                            CABEÇALHO
                        ========================= */}

                        <div className="flex items-center justify-between border-b border-white/5 p-6">

                            <div>

                                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-purple-400">
                                    {patenteEditando
                                        ? "Edição"
                                        : "Cadastro"}
                                </p>

                                <h3 className="mt-1 text-xl font-black">
                                    {patenteEditando
                                        ? "Editar patente"
                                        : "Nova patente"}
                                </h3>

                            </div>

                            <button
                                type="button"
                                onClick={fecharModal}
                                className="cursor-pointer flex h-9 w-9 items-center justify-center rounded-lg text-white/30 transition hover:bg-white/5 hover:text-white"
                            >
                                <X size={18} />
                            </button>

                        </div>

                        {/* =========================
                            FORMULÁRIO
                        ========================= */}

                        <form onSubmit={salvarPatente}>

                            <div className="space-y-5 p-6">

                                {/* ID */}

                                {patenteEditando && (

                                    <div>

                                        <label className="mb-2 block text-xs font-bold text-white/60">
                                            ID
                                        </label>

                                        <input
                                            disabled
                                            value={patenteEditando.id}
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
                                        Nome da patente
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
                                        placeholder="Ex: Mestre Supremo"
                                        className="h-12 w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 text-sm text-white outline-none placeholder:text-white/20 focus:border-purple-400/60"
                                    />

                                </div>

                                {/* PONTOS */}

                                <div>

                                    <label className="mb-2 block text-xs font-bold text-white/60">
                                        Pontos necessários
                                    </label>

                                    <div className="relative">

                                        <input
                                            required
                                            type="number"
                                            min={0}
                                            value={form.pontos}
                                            onChange={(event) =>
                                                atualizarCampo(
                                                    "pontos",
                                                    Number(event.target.value)
                                                )
                                            }
                                            placeholder="Ex: 1000"
                                            className="h-12 w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 pr-20 text-sm text-white outline-none placeholder:text-white/20 focus:border-purple-400/60"
                                        />

                                        <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-amber-400/70">
                                            PONTOS
                                        </span>

                                    </div>

                                    <p className="mt-2 text-[11px] text-white/20">
                                        Quantidade de pontos necessária para alcançar esta patente.
                                    </p>

                                </div>

                            </div>

                            {/* =========================
                                BOTÕES
                            ========================= */}

                            <div className="flex flex-col-reverse gap-3 border-t border-white/5 p-6 sm:flex-row sm:justify-end">

                                <button
                                    type="button"
                                    onClick={fecharModal}
                                    className="cursor-pointer h-11 rounded-xl border border-white/10 px-5 text-sm font-semibold text-white/50 transition hover:bg-white/5 hover:text-white"
                                >
                                    Cancelar
                                </button>

                                <button
                                    type="submit"
                                    disabled={
                                        !form.nome.trim() ||
                                        form.pontos < 0
                                    }
                                    className="cursor-pointer h-11 rounded-xl bg-purple-500 px-5 text-sm font-bold text-white transition hover:bg-purple-400 disabled:cursor-not-allowed disabled:opacity-40"
                                >
                                    {patenteEditando
                                        ? "Salvar alterações"
                                        : "Cadastrar patente"}
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

            <p className="mt-5 text-xs text-white/30">
                {label}
            </p>

        </div>
    );
}

