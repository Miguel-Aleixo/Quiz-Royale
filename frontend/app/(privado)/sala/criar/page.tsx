"use client";

import {
  ArrowLeft,
  Check,
  ChevronDown,
  Clock3,
  Gamepad2,
  Plus,
  Trash2,
  Users,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import { useBuscarUsuario } from "@/app/hooks/usuario/useBuscarUsuario";

interface Tema {
  id: number;
  nome: string;
}

interface AlternativaForm {
  texto: string;
  correta: boolean;
}

interface PerguntaForm {
  enunciado: string;
  temaId: number;
  tempoLimite: number;
  alternativas: AlternativaForm[];
}

export default function CriarSalaPage() {
  const router = useRouter();

  const API = process.env.NEXT_PUBLIC_API;
  const token = Cookies.get("token");

  const [nomeSala, setNomeSala] = useState("");
  const [codigo, setCodigo] = useState("");
  const [maxJogadores, setMaxJogadores] = useState(10);

  const [temas, setTemas] = useState<Tema[]>([]);
  const [perguntas, setPerguntas] = useState<PerguntaForm[]>([]);

  const [loadingTemas, setLoadingTemas] = useState(false);
  const [criandoSala, setCriandoSala] = useState(false);

  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");

  // =========================================================
  // BUSCAR TEMAS
  // =========================================================

  const buscarTemas = async () => {
    if (!API) return;

    try {
      setLoadingTemas(true);

      const res = await fetch(`${API}/tema`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...(token && {
            Authorization: `Bearer ${token}`,
          }),
        },
      });

      if (!res.ok) {
        throw new Error("Erro ao buscar temas");
      }

      const data: Tema[] = await res.json();

      setTemas(data);
    } catch (error) {
      console.error("Erro ao buscar temas:", error);
      setErro("Não foi possível carregar os temas.");
    } finally {
      setLoadingTemas(false);
    }
  };

  useEffect(() => {
    buscarTemas();
  }, []);

  // =========================================================
  // ADICIONAR PERGUNTA
  // =========================================================

  const adicionarPergunta = () => {
    setPerguntas((prev) => [
      ...prev,
      {
        enunciado: "",
        temaId: temas[0]?.id || 0,
        tempoLimite: 30,
        alternativas: [
          {
            texto: "",
            correta: false,
          },
          {
            texto: "",
            correta: false,
          },
          {
            texto: "",
            correta: false,
          },
          {
            texto: "",
            correta: false,
          },
        ],
      },
    ]);
  };

  // =========================================================
  // REMOVER PERGUNTA
  // =========================================================

  const removerPergunta = (index: number) => {
    setPerguntas((prev) => prev.filter((_, i) => i !== index));
  };

  // =========================================================
  // ALTERAR PERGUNTA
  // =========================================================

  const alterarPergunta = (
    index: number,
    campo: "enunciado" | "temaId" | "tempoLimite",
    valor: string | number
  ) => {
    setPerguntas((prev) =>
      prev.map((pergunta, i) => {
        if (i !== index) return pergunta;

        return {
          ...pergunta,
          [campo]: valor,
        };
      })
    );
  };

  // =========================================================
  // ALTERAR ALTERNATIVA
  // =========================================================

  const alterarAlternativa = (
    perguntaIndex: number,
    alternativaIndex: number,
    texto: string
  ) => {
    setPerguntas((prev) =>
      prev.map((pergunta, i) => {
        if (i !== perguntaIndex) return pergunta;

        return {
          ...pergunta,
          alternativas: pergunta.alternativas.map((alternativa, j) =>
            j === alternativaIndex
              ? {
                ...alternativa,
                texto,
              }
              : alternativa
          ),
        };
      })
    );
  };

  // =========================================================
  // DEFINIR ALTERNATIVA CORRETA
  // =========================================================

  const definirCorreta = (
    perguntaIndex: number,
    alternativaIndex: number
  ) => {
    setPerguntas((prev) =>
      prev.map((pergunta, i) => {
        if (i !== perguntaIndex) return pergunta;

        return {
          ...pergunta,
          alternativas: pergunta.alternativas.map((alternativa, j) => ({
            ...alternativa,
            correta: j === alternativaIndex,
          })),
        };
      })
    );
  };

  // =========================================================
  // VALIDAR FORMULÁRIO
  // =========================================================

  const validarFormulario = () => {
    if (!nomeSala.trim()) {
      setErro("Digite o nome da sala.");
      return false;
    }

    if (maxJogadores < 2 || maxJogadores > 50) {
      setErro("A sala deve ter entre 2 e 50 jogadores.");
      return false;
    }

    if (perguntas.length === 0) {
      setErro("Adicione pelo menos uma pergunta.");
      return false;
    }

    for (let i = 0; i < perguntas.length; i++) {
      const pergunta = perguntas[i];

      if (!pergunta.enunciado.trim()) {
        setErro(`Preencha o enunciado da pergunta ${i + 1}.`);
        return false;
      }

      if (!pergunta.temaId) {
        setErro(`Selecione um tema para a pergunta ${i + 1}.`);
        return false;
      }

      if (pergunta.tempoLimite < 5) {
        setErro(`O tempo da pergunta ${i + 1} deve ser de pelo menos 5 segundos.`);
        return false;
      }

      for (let j = 0; j < pergunta.alternativas.length; j++) {
        if (!pergunta.alternativas[j].texto.trim()) {
          setErro(
            `Preencha a alternativa ${j + 1} da pergunta ${i + 1}.`
          );
          return false;
        }
      }

      const quantidadeCorretas = pergunta.alternativas.filter(
        (alternativa) => alternativa.correta
      ).length;

      if (quantidadeCorretas !== 1) {
        setErro(
          `A pergunta ${i + 1} precisa ter exatamente uma alternativa correta.`
        );
        return false;
      }
    }

    return true;
  };

  // =========================================================
  // CRIAR SALA
  // =========================================================

  const criarSala = async () => {
    setErro("");
    setSucesso("");

    if (!token) {
      router.push("/login");
      return;
    }

    if (!validarFormulario()) {
      return;
    }

    if (!API) {
      setErro("API não configurada.");
      return;
    }

    try {
      setCriandoSala(true);

      // -----------------------------------------------------
      // 1. CRIAR SALA
      // -----------------------------------------------------

      const salaRes = await fetch(`${API}/sala`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          nome: nomeSala.trim(),
          maxJogadores,
          status: 'ABERTA'
        }),
      });

      if (!salaRes.ok) {
        const mensagem = await salaRes.text();

        throw new Error(
          mensagem || "Erro ao criar a sala."
        );
      }

      const sala = await salaRes.json();

      setCodigo(sala.codigo)

      // -----------------------------------------------------
      // 2. CRIAR PERGUNTAS
      // -----------------------------------------------------

      for (const pergunta of perguntas) {
        const perguntaRes = await fetch(`${API}/pergunta`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            enunciado: pergunta.enunciado.trim(),
            temaId: Number(pergunta.temaId),
          }),
        });

        if (!perguntaRes.ok) {
          const mensagem = await perguntaRes.text();

          throw new Error(
            mensagem || "Erro ao criar uma pergunta."
          );
        }

        const perguntaCriada = await perguntaRes.json();

        // ---------------------------------------------------
        // 3. CRIAR ALTERNATIVAS
        // ---------------------------------------------------

        for (const alternativa of pergunta.alternativas) {
          const alternativaRes = await fetch(`${API}/alternativa`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              texto: alternativa.texto.trim(),
              correta: alternativa.correta,
              perguntaId: perguntaCriada.id,
            }),
          });

          if (!alternativaRes.ok) {
            const mensagem = await alternativaRes.text();

            throw new Error(
              mensagem || "Erro ao criar uma alternativa."
            );
          }
        }

        // ---------------------------------------------------
        // 4. CRIAR RODADA
        // ---------------------------------------------------

        const rodadaRes = await fetch(`${API}/rodada`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            perguntaId: perguntaCriada.id,
            salaId: sala.id,
            ordem: perguntas.indexOf(pergunta) + 1,
            tempoLimite: pergunta.tempoLimite,
          }),
        });

        if (!rodadaRes.ok) {
          const mensagem = await rodadaRes.text();

          throw new Error(
            mensagem || "Erro ao criar a rodada."
          );
        }

      }

      setSucesso("Sala criada com sucesso!");

      /*
   * ============================
   * ENTRAR NA SALA
   * ============================
   */

      try {

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

        router.push(`/sala/entrar?codigo=${encodeURIComponent(sala.codigo)}`);
      } catch (error) {
        console.error(error)
      }

    } catch (error) {
      console.error("Erro ao criar sala:", error);

      setErro(
        error instanceof Error
          ? error.message
          : "Não foi possível criar a sala."
      );
    } finally {
      setCriandoSala(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#080812] text-white">
      {/* FUNDO */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-[-250px] h-[500px] w-[700px] -translate-x-1/2 rounded-full bg-violet-600/10 blur-[140px]" />
        <div className="absolute bottom-[-250px] right-[-100px] h-[500px] w-[500px] rounded-full bg-indigo-600/10 blur-[140px]" />
      </div>

      <div className="relative mx-auto w-full max-w-6xl px-5 py-8">
        {/* HEADER */}
        <div className="mb-10 flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-sm font-medium text-white/50 transition hover:text-white"
          >
            <ArrowLeft size={18} />
            Voltar
          </button>

          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-violet-400/20 bg-violet-500/10">
              <Gamepad2 size={18} className="text-violet-300" />
            </div>

            <span className="font-bold tracking-tight">
              Criar Sala
            </span>
          </div>
        </div>

        {/* TÍTULO */}
        <div className="mb-8">
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.25em] text-violet-400">
            Nova partida
          </p>

          <h1 className="text-3xl font-black tracking-tight sm:text-4xl">
            Monte sua batalha
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-white/45">
            Configure a sala, adicione as perguntas e defina as alternativas
            que os jogadores deverão responder.
          </p>
        </div>

        {/* ERRO */}
        {erro && (
          <div className="mb-6 flex items-start gap-3 rounded-2xl border border-red-400/20 bg-red-500/10 p-4 text-sm text-red-200">
            <X size={18} className="mt-0.5 shrink-0" />
            <span>{erro}</span>
          </div>
        )}

        {/* SUCESSO */}
        {sucesso && (
          <div className="mb-6 flex items-start gap-3 rounded-2xl border border-emerald-400/20 bg-emerald-500/10 p-4 text-sm text-emerald-200">
            <Check size={18} className="mt-0.5 shrink-0" />
            <span>{sucesso}</span>
          </div>
        )}

        <div className="space-y-6">
          {/* CONFIGURAÇÃO DA SALA */}
          <section className="rounded-3xl border border-white/10 bg-[#10101d]/80 p-6 shadow-2xl shadow-black/20 backdrop-blur-xl">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10">
                <Gamepad2 size={19} className="text-violet-300" />
              </div>

              <div>
                <h2 className="font-bold">Configuração da sala</h2>
                <p className="text-xs text-white/35">
                  Defina as informações básicas da partida.
                </p>
              </div>
            </div>

            <div className="grid gap-5 w-full">
              {/* NOME */}
              <div>
                <label className="mb-2 block text-xs font-bold text-white/60">
                  Nome da sala
                </label>

                <input
                  value={nomeSala}
                  onChange={(e) => setNomeSala(e.target.value)}
                  placeholder="Ex: Desafio de JavaScript"
                  className="h-12 w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 text-sm outline-none transition placeholder:text-white/20 focus:border-violet-400/40 focus:bg-white/[0.05]"
                />
              </div>

              {/* JOGADORES */}
              <div >
                <label className="mb-2 block text-xs font-bold text-white/60">
                  Máximo de jogadores
                </label>

                <div className="relative">
                  <Users
                    size={17}
                    className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-white/30"
                  />

                  <select
                    value={maxJogadores}
                    onChange={(e) =>
                      setMaxJogadores(Number(e.target.value))
                    }
                    className="h-12 w-full appearance-none rounded-xl border border-white/10 bg-white/[0.03] pl-11 pr-10 text-sm outline-none transition focus:border-violet-400/40"
                  >
                    {[2, 5, 10, 15, 20, 30, 40, 50].map((quantidade) => (
                      <option
                        key={quantidade}
                        value={quantidade}
                        className="bg-[#10101d]"
                      >
                        {quantidade} jogadores
                      </option>
                    ))}
                  </select>

                  <ChevronDown
                    size={16}
                    className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-white/30"
                  />
                </div>
              </div>
            </div>
          </section>

          {/* PERGUNTAS */}
          <section className="rounded-3xl border border-white/10 bg-[#10101d]/80 p-6 shadow-2xl shadow-black/20 backdrop-blur-xl">
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10">
                  <Gamepad2 size={19} className="text-indigo-300" />
                </div>

                <div>
                  <h2 className="font-bold">
                    Perguntas
                    <span className="ml-2 text-white/25">
                      {perguntas.length}
                    </span>
                  </h2>

                  <p className="text-xs text-white/35">
                    Adicione as perguntas desta partida.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={adicionarPergunta}
                disabled={loadingTemas || temas.length === 0}
                className="flex h-10 items-center justify-center gap-2 rounded-xl border border-violet-400/20 bg-violet-500/10 px-4 text-xs font-bold text-violet-200 transition hover:border-violet-400/40 hover:bg-violet-500/20 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Plus size={16} />
                Adicionar pergunta
              </button>
            </div>

            {/* SEM PERGUNTAS */}
            {perguntas.length === 0 && (
              <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] px-6 py-12 text-center">
                <Gamepad2
                  size={30}
                  className="mx-auto mb-4 text-white/20"
                />

                <p className="text-sm font-semibold text-white/60">
                  Nenhuma pergunta adicionada
                </p>

                <p className="mt-1 text-xs text-white/30">
                  Clique em “Adicionar pergunta” para começar.
                </p>
              </div>
            )}

            {/* LISTA DE PERGUNTAS */}
            <div className="space-y-6">
              {perguntas.map((pergunta, perguntaIndex) => (
                <div
                  key={perguntaIndex}
                  className="rounded-2xl border border-white/10 bg-black/10 p-5"
                >
                  {/* CABEÇALHO DA PERGUNTA */}
                  <div className="mb-5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-500/10 text-xs font-black text-violet-300">
                        {perguntaIndex + 1}
                      </div>

                      <div>
                        <p className="text-sm font-bold">
                          Pergunta {perguntaIndex + 1}
                        </p>

                        <p className="text-[11px] text-white/30">
                          Defina o enunciado e as alternativas.
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => removerPergunta(perguntaIndex)}
                      className="flex h-9 w-9 items-center justify-center rounded-xl text-white/30 transition hover:bg-red-500/10 hover:text-red-300"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  <div className="space-y-5">
                    {/* ENUNCIADO */}
                    <div>
                      <label className="mb-2 block text-xs font-bold text-white/60">
                        Enunciado
                      </label>

                      <textarea
                        value={pergunta.enunciado}
                        onChange={(e) =>
                          alterarPergunta(
                            perguntaIndex,
                            "enunciado",
                            e.target.value
                          )
                        }
                        placeholder="Digite a pergunta..."
                        rows={3}
                        className="w-full resize-none rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm outline-none transition placeholder:text-white/20 focus:border-violet-400/40"
                      />
                    </div>

                    {/* TEMA + TEMPO */}
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className="mb-2 block text-xs font-bold text-white/60">
                          Tema
                        </label>

                        <div className="relative">
                          <select
                            value={pergunta.temaId}
                            onChange={(e) =>
                              alterarPergunta(
                                perguntaIndex,
                                "temaId",
                                Number(e.target.value)
                              )
                            }
                            className="h-11 w-full appearance-none rounded-xl border border-white/10 bg-white/[0.03] px-4 pr-10 text-sm outline-none transition focus:border-violet-400/40"
                          >
                            <option value={0} className="bg-[#10101d]">
                              Selecione um tema
                            </option>

                            {temas.map((tema) => (
                              <option
                                key={tema.id}
                                value={tema.id}
                                className="bg-[#10101d]"
                              >
                                {tema.nome}
                              </option>
                            ))}
                          </select>

                          <ChevronDown
                            size={16}
                            className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-white/30"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="mb-2 block text-xs font-bold text-white/60">
                          Tempo para responder
                        </label>

                        <div className="relative">
                          <Clock3
                            size={16}
                            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-white/30"
                          />

                          <select
                            value={pergunta.tempoLimite}
                            onChange={(e) =>
                              alterarPergunta(
                                perguntaIndex,
                                "tempoLimite",
                                Number(e.target.value)
                              )
                            }
                            className="h-11 w-full appearance-none rounded-xl border border-white/10 bg-white/[0.03] pl-11 pr-10 text-sm outline-none transition focus:border-violet-400/40"
                          >
                            {[10, 15, 20, 30, 45, 60, 90].map((tempo) => (
                              <option
                                key={tempo}
                                value={tempo}
                                className="bg-[#10101d]"
                              >
                                {tempo} segundos
                              </option>
                            ))}
                          </select>

                          <ChevronDown
                            size={16}
                            className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-white/30"
                          />
                        </div>
                      </div>
                    </div>

                    {/* ALTERNATIVAS */}
                    <div>
                      <div className="mb-3 flex items-center justify-between">
                        <label className="text-xs font-bold text-white/60">
                          Alternativas
                        </label>

                        <span className="text-[10px] text-white/25">
                          Clique no círculo para marcar a correta
                        </span>
                      </div>

                      <div className="grid gap-3">
                        {pergunta.alternativas.map(
                          (alternativa, alternativaIndex) => (
                            <div
                              key={alternativaIndex}
                              className={`flex items-center gap-3 rounded-xl border p-2 transition ${alternativa.correta
                                ? "border-emerald-400/30 bg-emerald-500/[0.06]"
                                : "border-white/10 bg-white/[0.02]"
                                }`}
                            >
                              <button
                                type="button"
                                onClick={() =>
                                  definirCorreta(
                                    perguntaIndex,
                                    alternativaIndex
                                  )
                                }
                                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border text-xs font-black transition ${alternativa.correta
                                  ? "border-emerald-400/40 bg-emerald-500/15 text-emerald-300"
                                  : "border-white/10 bg-white/[0.03] text-white/30 hover:border-violet-400/30 hover:text-violet-300"
                                  }`}
                              >
                                {alternativa.correta ? (
                                  <Check size={15} />
                                ) : (
                                  String.fromCharCode(
                                    65 + alternativaIndex
                                  )
                                )}
                              </button>

                              <input
                                value={alternativa.texto}
                                onChange={(e) =>
                                  alterarAlternativa(
                                    perguntaIndex,
                                    alternativaIndex,
                                    e.target.value
                                  )
                                }
                                placeholder={`Alternativa ${String.fromCharCode(
                                  65 + alternativaIndex
                                )}`}
                                className="h-10 min-w-0 flex-1 bg-transparent px-1 text-sm outline-none placeholder:text-white/20"
                              />
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* RESUMO */}
          <section className="rounded-3xl border border-white/10 bg-[#10101d]/80 p-6 shadow-2xl shadow-black/20 backdrop-blur-xl">
            <div className="mb-5">
              <h2 className="font-bold">Resumo da sala</h2>
              <p className="mt-1 text-xs text-white/35">
                Confira as configurações antes de criar a partida.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
                <p className="text-[10px] font-bold uppercase tracking-wider text-white/25">
                  Jogadores
                </p>

                <p className="mt-2 text-xl font-black">
                  {maxJogadores}
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
                <p className="text-[10px] font-bold uppercase tracking-wider text-white/25">
                  Perguntas
                </p>

                <p className="mt-2 text-xl font-black">
                  {perguntas.length}
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
                <p className="text-[10px] font-bold uppercase tracking-wider text-white/25">
                  Código
                </p>

                <p className="mt-2 text-xl font-black tracking-widest">
                  {codigo || "---"}
                </p>
              </div>
            </div>
          </section>

          {/* BOTÃO */}
          <div className="flex justify-end pb-10">
            <button
              type="button"
              onClick={criarSala}
              disabled={criandoSala}
              className="flex h-13 items-center justify-center gap-2 rounded-2xl bg-violet-600 px-7 text-sm font-black shadow-xl shadow-violet-950/30 transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {criandoSala ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Criando sala...
                </>
              ) : (
                <>
                  <Check size={18} />
                  Criar sala
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}