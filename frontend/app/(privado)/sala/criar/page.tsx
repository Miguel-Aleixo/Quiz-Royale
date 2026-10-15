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
  Database,
  Pencil,
  Search,
  BookOpen,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import { toast } from "sonner";
import Image from "next/image";
import Link from "next/link";

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

interface AlternativaBanco {
  id: number;
  texto: string;
  correta: boolean;
  perguntaId: number;
}

interface PerguntaBanco {
  id: number;
  enunciado: string;
  temaId: number;
  tema?: Tema;
  alternativas: AlternativaBanco[];
}

interface PerguntaSelecionada {
  perguntaId: number;
  tempoLimite: number;
}

type ModoPerguntas = "banco" | "proprias";

export default function CriarSalaPage() {
  const router = useRouter();

  const API = process.env.NEXT_PUBLIC_API;

  const [nomeSala, setNomeSala] = useState("");
  const [codigo, setCodigo] = useState("");
  const [maxJogadores, setMaxJogadores] = useState(10);

  const [temas, setTemas] = useState<Tema[]>([]);
  const [perguntas, setPerguntas] = useState<PerguntaForm[]>([]);
  const [perguntasBanco, setPerguntasBanco] = useState<PerguntaBanco[]>(
    []
  );
  const [selecionadasBanco, setSelecionadasBanco] = useState<
    PerguntaSelecionada[]
  >([]);

  const [modoPerguntas, setModoPerguntas] =
    useState<ModoPerguntas>("banco");

  const [temaFiltro, setTemaFiltro] = useState("todos");
  const [busca, setBusca] = useState("");

  const [loadingTemas, setLoadingTemas] = useState(false);
  const [loadingPerguntas, setLoadingPerguntas] = useState(false);
  const [criandoSala, setCriandoSala] = useState(false);

  const headers = useCallback((): HeadersInit => {
    const token = Cookies.get("token");

    return {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  }, []);

  const mensagemErro = (data: unknown, fallback: string) => {
    if (
      data &&
      typeof data === "object" &&
      "message" in data
    ) {
      const message = (data as { message?: unknown }).message;

      if (Array.isArray(message)) {
        return message.join(", ");
      }

      if (typeof message === "string") {
        return message;
      }
    }

    return fallback;
  };

  const lerResposta = async (res: Response) => {
    const texto = await res.text();

    if (!texto) return null;

    try {
      return JSON.parse(texto);
    } catch {
      return texto;
    }
  };

  // =========================================================
  // BUSCAR TEMAS
  // =========================================================

  const buscarTemas = useCallback(async () => {
    if (!API) {
      toast.error("API não configurada.");
      return;
    }

    try {
      setLoadingTemas(true);

      const res = await fetch(`${API}/tema`, {
        headers: headers(),
      });

      const data = await lerResposta(res);

      if (!res.ok) {
        toast.error(mensagemErro(data, "Erro ao buscar temas."));
        return;
      }

      setTemas(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Erro ao buscar temas:", error);
      toast.error("Não foi possível conectar ao servidor.");
    } finally {
      setLoadingTemas(false);
    }
  }, [API, headers]);

  // =========================================================
  // BUSCAR BANCO DE PERGUNTAS
  // =========================================================

  const buscarPerguntasBanco = useCallback(async () => {
    if (!API) return;

    const token = Cookies.get("token");

    if (!token) {
      toast.error("Faça login para consultar as perguntas.");
      return;
    }

    try {
      setLoadingPerguntas(true);

      const res = await fetch(`${API}/pergunta`, {
        headers: headers(),
        cache: "no-store",
      });

      const data = await lerResposta(res);

      if (!res.ok) {
        toast.error(
          mensagemErro(
            data,
            res.status === 403
              ? "Sua conta não tem permissão para consultar o banco de perguntas."
              : "Erro ao buscar perguntas."
          )
        );
        return;
      }

      if (!Array.isArray(data)) {
        toast.error("A API retornou um formato inválido de perguntas.");
        return;
      }

      setPerguntasBanco(
        data.filter(
          (pergunta: PerguntaBanco) =>
            typeof pergunta.id === "number" &&
            typeof pergunta.enunciado === "string" &&
            Array.isArray(pergunta.alternativas)
        )
      );
    } catch (error) {
      console.error("Erro ao buscar perguntas:", error);
      toast.error("Não foi possível carregar o banco de perguntas.");
    } finally {
      setLoadingPerguntas(false);
    }
  }, [API, headers]);

  useEffect(() => {
    buscarTemas();
    buscarPerguntasBanco();
  }, [buscarTemas, buscarPerguntasBanco]);

  // =========================================================
  // ADICIONAR PERGUNTA PRÓPRIA
  // =========================================================

  const adicionarPergunta = () => {
    setPerguntas((prev) => [
      ...prev,
      {
        enunciado: "",
        temaId: temas[0]?.id || 0,
        tempoLimite: 30,
        alternativas: [
          { texto: "", correta: false },
          { texto: "", correta: false },
          { texto: "", correta: false },
          { texto: "", correta: false },
        ],
      },
    ]);
  };

  const removerPergunta = (index: number) => {
    setPerguntas((prev) => prev.filter((_, i) => i !== index));
  };

  const alterarPergunta = (
    index: number,
    campo: "enunciado" | "temaId" | "tempoLimite",
    valor: string | number
  ) => {
    setPerguntas((prev) =>
      prev.map((pergunta, i) =>
        i === index ? { ...pergunta, [campo]: valor } : pergunta
      )
    );
  };

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
            j === alternativaIndex ? { ...alternativa, texto } : alternativa
          ),
        };
      })
    );
  };

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
  // SELECIONAR PERGUNTAS DO BANCO
  // =========================================================

  const alternarPerguntaBanco = (perguntaId: number) => {
    setSelecionadasBanco((prev) => {
      const existe = prev.some((item) => item.perguntaId === perguntaId);

      if (existe) {
        return prev.filter((item) => item.perguntaId !== perguntaId);
      }

      return [...prev, { perguntaId, tempoLimite: 30 }];
    });
  };

  const alterarTempoBanco = (perguntaId: number, tempoLimite: number) => {
    setSelecionadasBanco((prev) =>
      prev.map((item) =>
        item.perguntaId === perguntaId
          ? { ...item, tempoLimite }
          : item
      )
    );
  };

  const perguntaEstaSelecionada = (perguntaId: number) =>
    selecionadasBanco.some((item) => item.perguntaId === perguntaId);

  const perguntasFiltradas = perguntasBanco.filter((pergunta) => {
    const correspondeTema =
      temaFiltro === "todos" ||
      pergunta.temaId === Number(temaFiltro);

    const correspondeBusca = pergunta.enunciado
      .toLocaleLowerCase("pt-BR")
      .includes(busca.toLocaleLowerCase("pt-BR"));

    return correspondeTema && correspondeBusca;
  });

  const perguntasValidasBanco = selecionadasBanco.filter((item) => {
    const pergunta = perguntasBanco.find(
      (p) => p.id === item.perguntaId
    );

    return (
      pergunta &&
      pergunta.alternativas.length >= 2 &&
      pergunta.alternativas.some((a) => a.correta) &&
      pergunta.alternativas.every(
        (a) => typeof a.texto === "string" && a.texto.trim().length > 0
      ) &&
      item.tempoLimite >= 5
    );
  });

  // =========================================================
  // VALIDAR FORMULÁRIO
  // =========================================================

  const validarFormulario = () => {
    if (!nomeSala.trim()) {
      toast.error("Digite o nome da sala.");
      return false;
    }

    if (maxJogadores < 2 || maxJogadores > 50) {
      toast.error("A sala deve ter entre 2 e 50 jogadores.");
      return false;
    }

    if (modoPerguntas === "banco") {
      if (selecionadasBanco.length === 0) {
        toast.error("Selecione pelo menos uma pergunta do banco.");
        return false;
      }

      for (const item of selecionadasBanco) {
        const pergunta = perguntasBanco.find(
          (p) => p.id === item.perguntaId
        );

        if (!pergunta) {
          toast.error("Uma das perguntas selecionadas não foi encontrada.");
          return false;
        }

        if (item.tempoLimite < 5) {
          toast.error("O tempo mínimo por pergunta é de 5 segundos.");
          return false;
        }

        if (pergunta.alternativas.length < 2) {
          toast.error(
            `A pergunta "${pergunta.enunciado}" precisa ter pelo menos duas alternativas.`
          );
          return false;
        }

        if (
          !pergunta.alternativas.some((alternativa) => alternativa.correta)
        ) {
          toast.error(
            `A pergunta "${pergunta.enunciado}" não possui uma resposta correta cadastrada.`
          );
          return false;
        }

        if (
          pergunta.alternativas.some(
            (alternativa) => !alternativa.texto?.trim()
          )
        ) {
          toast.error(
            `A pergunta "${pergunta.enunciado}" possui alternativas vazias.`
          );
          return false;
        }
      }

      return true;
    }

    if (perguntas.length === 0) {
      toast.error("Adicione pelo menos uma pergunta.");
      return false;
    }

    for (let i = 0; i < perguntas.length; i++) {
      const pergunta = perguntas[i];

      if (!pergunta.enunciado.trim()) {
        toast.error(`Preencha o enunciado da pergunta ${i + 1}.`);
        return false;
      }

      if (!pergunta.temaId) {
        toast.error(`Selecione um tema para a pergunta ${i + 1}.`);
        return false;
      }

      if (pergunta.tempoLimite < 5) {
        toast.error(
          `O tempo da pergunta ${i + 1} deve ser de pelo menos 5 segundos.`
        );
        return false;
      }

      if (pergunta.alternativas.some((a) => !a.texto.trim())) {
        toast.error(
          `Preencha todas as alternativas da pergunta ${i + 1}.`
        );
        return false;
      }

      const corretas = pergunta.alternativas.filter((a) => a.correta).length;

      if (corretas !== 1) {
        toast.error(
          `A pergunta ${i + 1} precisa ter exatamente uma alternativa correta.`
        );
        return false;
      }
    }

    return true;
  };

  // =========================================================
  // CRIAR RODADA
  // =========================================================

  const criarRodada = async (
    perguntaId: number,
    salaId: number,
    ordem: number,
    tempoLimite: number,
    token: string
  ) => {
    const res = await fetch(`${API}/rodada`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        perguntaId,
        salaId,
        ordem,
        tempoLimite,
      }),
    });

    const data = await lerResposta(res);

    if (!res.ok) {
      throw new Error(
        mensagemErro(data, `Erro ao criar a rodada ${ordem}.`)
      );
    }
  };

  // =========================================================
  // CRIAR SALA
  // =========================================================

  const criarSala = async () => {
    const token = Cookies.get("token");

    if (!token) {
      toast.error("Você precisa estar logado para criar uma sala.");
      router.push("/login");
      return;
    }

    if (!validarFormulario()) return;

    if (!API) {
      toast.error("API não configurada.");
      return;
    }

    try {
      setCriandoSala(true);

      // 1. Criar sala
      const salaRes = await fetch(`${API}/sala`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          nome: nomeSala.trim(),
          maxJogadores,
          status: "ABERTA",
        }),
      });

      const salaData = await lerResposta(salaRes);

      if (!salaRes.ok) {
        toast.error(mensagemErro(salaData, "Erro ao criar a sala."));
        return;
      }

      const sala = salaData as { id: number; codigo: string };

      const codigoSala = String(sala?.codigo ?? "")
        .trim()
        .toUpperCase();

      if (!sala?.id || !codigoSala) {
        toast.error("A API não retornou o ID ou o código da sala.");
        return;
      }

      setCodigo(codigoSala);

      // 2. Preparar as rodadas de acordo com o modo escolhido
      if (modoPerguntas === "banco") {
        for (const [index, item] of selecionadasBanco.entries()) {
          await criarRodada(
            item.perguntaId,
            sala.id,
            index + 1,
            item.tempoLimite,
            token
          );
        }
      } else {
        for (const [index, pergunta] of perguntas.entries()) {
          // Cadastrar pergunta própria
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

          const perguntaData = await lerResposta(perguntaRes);

          if (!perguntaRes.ok) {
            throw new Error(
              mensagemErro(
                perguntaData,
                `Erro ao criar a pergunta ${index + 1}.`
              )
            );
          }

          const perguntaCriada = perguntaData as { id: number };

          if (!perguntaCriada?.id) {
            throw new Error(
              `A API não retornou o ID da pergunta ${index + 1}.`
            );
          }

          // Cadastrar alternativas
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

            const alternativaData = await lerResposta(alternativaRes);

            if (!alternativaRes.ok) {
              throw new Error(
                mensagemErro(
                  alternativaData,
                  "Erro ao cadastrar uma alternativa."
                )
              );
            }
          }

          // Criar rodada
          await criarRodada(
            perguntaCriada.id,
            sala.id,
            index + 1,
            pergunta.tempoLimite,
            token
          );
        }
      }

      // 3. Entrar automaticamente na sala
      const tokenAtual = Cookies.get("token");

      if (!tokenAtual) {
        toast.error("Sua sessão expirou. Faça login novamente.");
        router.push("/login");
        return;
      }

      const entrarRes = await fetch(`${API}/sala/entrar`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${tokenAtual}`,
        },
        body: JSON.stringify({
          codigo: codigoSala,
        }),
      });

      const entrarData = await lerResposta(entrarRes);

      if (!entrarRes.ok) {
        toast.error(
          mensagemErro(entrarData, "Erro ao entrar na sala.")
        );
        return;
      }

      toast.success("Sala criada com sucesso!");

      router.push(
        `/sala/entrar?codigo=${encodeURIComponent(codigoSala)}`
      );
    } catch (error) {
      console.error("Erro ao criar sala:", error);

      toast.error(
        error instanceof Error
          ? error.message
          : "Não foi possível concluir a criação da sala."
      );
    } finally {
      setCriandoSala(false);
    }
  };

  const quantidadePerguntas =
    modoPerguntas === "banco"
      ? selecionadasBanco.length
      : perguntas.length;

  return (
    <main className="min-h-screen bg-[#070711] text-white selection:bg-fuchsia-400/30">
      {/* FUNDO */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-[-280px] h-[560px] w-[760px] -translate-x-1/2 rounded-full bg-fuchsia-600/15 blur-[150px]" />
        <div className="absolute bottom-[-280px] right-[-100px] h-[560px] w-[560px] rounded-full bg-cyan-600/10 blur-[150px]" />
        <div className="absolute inset-0 opacity-[0.035] [background-image:linear-gradient(rgba(255,255,255,.8)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.8)_1px,transparent_1px)] [background-size:44px_44px]" />
      </div>

      <div className="relative mx-auto mt-20 w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
        {/* HEADER */}
        <header className="fixed left-0 right-0 top-0 z-50 mt-5 px-4 sm:px-6">
          <div className="mx-auto max-w-6xl">
            <nav className="flex h-16 items-center justify-between rounded-3xl border border-white/10 bg-[#10101d]/90 px-5 shadow-2xl shadow-black/20 backdrop-blur-xl">
              <div className="flex items-center gap-4">
                <Link
                  href="/"
                  className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-white/40 transition hover:-translate-x-0.5 hover:border-fuchsia-300/30 hover:bg-fuchsia-500/10 hover:text-fuchsia-100"
                >
                  <ArrowLeft size={18} />
                </Link>

                <span className="font-black tracking-tight">
                  Criar Sala
                </span>
              </div>

              <Link href="/" className="transition-opacity hover:opacity-80">
                <Image
                  src="/imagens/logo_dark_menor.png"
                  alt="Logo Quiz Royale"
                  width={130}
                  height={60}
                  className="object-contain"
                  priority
                />
              </Link>
            </nav>
          </div>
        </header>

        {/* TÍTULO */}
        <div className="mb-8">
          <p className="mb-3 flex items-center gap-2 text-xs font-black uppercase tracking-[0.25em] text-fuchsia-300">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-fuchsia-300 shadow-[0_0_12px_rgba(232,121,249,.9)]" />
            Nova missão
          </p>

          <h1 className="bg-gradient-to-r from-white via-fuchsia-100 to-violet-300 bg-clip-text text-3xl font-black tracking-tight text-transparent sm:text-5xl">
            Monte sua batalha<span className="text-fuchsia-300">.</span>
          </h1>

          <p className="mt-4 max-w-2xl text-sm leading-6 text-white/45">
            Configure a sala e escolha entre perguntas já cadastradas
            ou perguntas criadas por você.
          </p>
        </div>

        <div className="flex flex-col gap-6">
          {/* CONFIGURAÇÃO DA SALA */}
          <section className="rounded-3xl border border-white/[0.09] bg-white/[0.045] p-5 shadow-2xl shadow-black/30 backdrop-blur-xl transition hover:border-fuchsia-400/20">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-fuchsia-500/10 ring-1 ring-fuchsia-300/15">
                <Gamepad2 size={19} className="text-fuchsia-300" />
              </div>

              <div>
                <h2 className="font-bold">Configuração da sala</h2>
                <p className="text-xs text-white/35">
                  Defina as informações básicas da partida.
                </p>
              </div>
            </div>

            <div className="grid gap-5">
              <div>
                <label className="mb-2 block text-xs font-bold text-white/60">
                  Nome da sala
                </label>

                <input
                  value={nomeSala}
                  onChange={(e) => setNomeSala(e.target.value)}
                  maxLength={80}
                  placeholder="Ex: Desafio de JavaScript"
                  className="h-12 w-full rounded-xl border border-white/10 bg-black/20 px-4 text-sm outline-none transition placeholder:text-white/20 focus:border-fuchsia-400/50 focus:bg-fuchsia-400/[0.04] focus:ring-4 focus:ring-fuchsia-400/5"
                />
              </div>

              <div>
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
                    onChange={(e) => setMaxJogadores(Number(e.target.value))}
                    className="h-12 w-full appearance-none rounded-xl border border-white/10 bg-black/20 pl-11 pr-10 text-sm outline-none transition focus:border-fuchsia-400/50 focus:ring-4 focus:ring-fuchsia-400/5"
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

          {/* MODO DAS PERGUNTAS */}
          <section className="rounded-3xl border border-white/[0.09] bg-white/[0.045] p-5 shadow-2xl shadow-black/30 backdrop-blur-xl sm:p-6">
            <div className="mb-5">
              <h2 className="font-bold">Como deseja montar as perguntas?</h2>
              <p className="mt-1 text-xs text-white/35">
                Escolha uma das opções para configurar sua partida.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setModoPerguntas("banco")}
                className={`rounded-2xl border p-5 text-left transition ${
                  modoPerguntas === "banco"
                    ? "border-fuchsia-400/50 bg-fuchsia-500/[0.10] shadow-lg shadow-fuchsia-950/20"
                    : "border-white/10 bg-black/20 hover:border-white/20 hover:bg-white/[0.03]"
                }`}
              >
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-fuchsia-500/15 text-fuchsia-300">
                    <Database size={21} />
                  </div>

                  {modoPerguntas === "banco" && (
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-fuchsia-400/15 text-fuchsia-200">
                      <Check size={16} />
                    </span>
                  )}
                </div>

                <p className="font-bold">Usar banco de perguntas</p>
                <p className="mt-2 text-xs leading-5 text-white/45">
                  Escolha perguntas existentes, selecione um tema e defina
                  o tempo de cada rodada.
                </p>

                <p className="mt-4 text-xs font-bold text-fuchsia-300">
                  {perguntasBanco.length} perguntas carregadas
                </p>
              </button>

              <button
                type="button"
                onClick={() => setModoPerguntas("proprias")}
                className={`rounded-2xl border p-5 text-left transition ${
                  modoPerguntas === "proprias"
                    ? "border-violet-400/50 bg-violet-500/[0.10] shadow-lg shadow-violet-950/20"
                    : "border-white/10 bg-black/20 hover:border-white/20 hover:bg-white/[0.03]"
                }`}
              >
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-500/15 text-violet-300">
                    <Pencil size={21} />
                  </div>

                  {modoPerguntas === "proprias" && (
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-violet-400/15 text-violet-200">
                      <Check size={16} />
                    </span>
                  )}
                </div>

                <p className="font-bold">Criar minhas perguntas</p>
                <p className="mt-2 text-xs leading-5 text-white/45">
                  Escreva seus próprios enunciados, cadastre alternativas
                  e marque as respostas corretas.
                </p>

                <p className="mt-4 text-xs font-bold text-violet-300">
                  {perguntas.length} perguntas próprias
                </p>
              </button>
            </div>
          </section>

          {/* MODO BANCO */}
          {modoPerguntas === "banco" && (
            <section className="rounded-3xl border border-white/[0.09] bg-white/[0.045] p-5 shadow-2xl shadow-black/30 backdrop-blur-xl sm:p-6">
              <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-fuchsia-500/10 ring-1 ring-fuchsia-300/15">
                    <BookOpen size={19} className="text-fuchsia-300" />
                  </div>

                  <div>
                    <h2 className="font-bold">
                      Banco de perguntas
                      <span className="ml-2 text-fuchsia-300">
                        {selecionadasBanco.length} selecionadas
                      </span>
                    </h2>

                    <p className="text-xs text-white/35">
                      Marque as perguntas que farão parte da partida.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={buscarPerguntasBanco}
                  disabled={loadingPerguntas}
                  className="flex h-10 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-4 text-xs font-bold text-white/70 transition hover:border-fuchsia-300/30 hover:text-fuchsia-200 disabled:opacity-50"
                >
                  <Search size={15} />
                  {loadingPerguntas ? "Carregando..." : "Atualizar"}
                </button>
              </div>

              <div className="mb-5 grid gap-3 sm:grid-cols-2">
                <div className="relative">
                  <Search
                    size={16}
                    className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-white/30"
                  />

                  <input
                    value={busca}
                    onChange={(e) => setBusca(e.target.value)}
                    placeholder="Buscar pergunta..."
                    className="h-11 w-full rounded-xl border border-white/10 bg-black/20 pl-10 pr-4 text-sm outline-none transition placeholder:text-white/25 focus:border-fuchsia-400/50"
                  />
                </div>

                <div className="relative">
                  <select
                    value={temaFiltro}
                    onChange={(e) => setTemaFiltro(e.target.value)}
                    className="h-11 w-full appearance-none rounded-xl border border-white/10 bg-black/20 px-4 pr-10 text-sm outline-none transition focus:border-fuchsia-400/50"
                  >
                    <option value="todos" className="bg-[#10101d]">
                      Todos os temas
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

              {loadingPerguntas && perguntasBanco.length === 0 ? (
                <div className="rounded-2xl border border-white/10 bg-black/20 px-5 py-12 text-center">
                  <div className="mx-auto mb-3 h-7 w-7 animate-spin rounded-full border-2 border-fuchsia-300/20 border-t-fuchsia-300" />
                  <p className="text-sm text-white/50">
                    Carregando perguntas...
                  </p>
                </div>
              ) : perguntasFiltradas.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-white/10 bg-black/20 px-5 py-12 text-center">
                  <BookOpen
                    size={28}
                    className="mx-auto mb-3 text-white/20"
                  />

                  <p className="text-sm font-semibold text-white/60">
                    Nenhuma pergunta encontrada
                  </p>

                  <p className="mt-2 text-xs leading-5 text-white/35">
                    Tente alterar o filtro ou cadastre perguntas pelo painel
                    administrativo.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {perguntasFiltradas.map((pergunta) => {
                    const selecionada = perguntaEstaSelecionada(pergunta.id);
                    const configuracao = selecionadasBanco.find(
                      (item) => item.perguntaId === pergunta.id
                    );

                    return (
                      <div
                        key={pergunta.id}
                        className={`rounded-2xl border p-4 transition ${
                          selecionada
                            ? "border-fuchsia-400/35 bg-fuchsia-500/[0.06]"
                            : "border-white/10 bg-black/20 hover:border-white/20"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <button
                            type="button"
                            onClick={() => alternarPerguntaBanco(pergunta.id)}
                            aria-label={
                              selecionada
                                ? "Desmarcar pergunta"
                                : "Selecionar pergunta"
                            }
                            className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border transition ${
                              selecionada
                                ? "border-fuchsia-400 bg-fuchsia-500 text-white"
                                : "border-white/20 bg-white/[0.03] text-transparent hover:border-fuchsia-300/50"
                            }`}
                          >
                            <Check size={15} />
                          </button>

                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="rounded-md border border-violet-300/15 bg-violet-400/[0.08] px-2 py-1 text-[10px] font-bold text-violet-200">
                                {pergunta.tema?.nome ??
                                  temas.find((t) => t.id === pergunta.temaId)
                                    ?.nome ??
                                  "Sem tema"}
                              </span>

                              <span className="text-[10px] text-white/30">
                                {pergunta.alternativas.length} alternativas
                              </span>
                            </div>

                            <p className="mt-3 break-words text-sm font-semibold leading-6 text-white/85">
                              {pergunta.enunciado}
                            </p>

                            <div className="mt-3 grid gap-2 sm:grid-cols-2">
                              {pergunta.alternativas.map((alternativa) => (
                                <div
                                  key={alternativa.id}
                                  className={`rounded-lg border px-3 py-2 text-xs ${
                                    alternativa.correta
                                      ? "border-emerald-400/20 bg-emerald-500/[0.06] text-emerald-200"
                                      : "border-white/[0.06] bg-white/[0.02] text-white/45"
                                  }`}
                                >
                                  {alternativa.correta && (
                                    <Check
                                      size={12}
                                      className="mr-1 inline"
                                    />
                                  )}
                                  {alternativa.texto}
                                </div>
                              ))}
                            </div>

                            {selecionada && (
                              <div className="mt-4 flex items-center gap-3 border-t border-white/[0.07] pt-3">
                                <Clock3
                                  size={15}
                                  className="shrink-0 text-fuchsia-300"
                                />

                                <label
                                  htmlFor={`tempo-${pergunta.id}`}
                                  className="text-xs text-white/55"
                                >
                                  Tempo para responder
                                </label>

                                <select
                                  id={`tempo-${pergunta.id}`}
                                  value={configuracao?.tempoLimite ?? 30}
                                  onChange={(e) =>
                                    alterarTempoBanco(
                                      pergunta.id,
                                      Number(e.target.value)
                                    )
                                  }
                                  className="ml-auto h-9 rounded-lg border border-white/10 bg-[#10101d] px-3 text-xs outline-none focus:border-fuchsia-400/50"
                                >
                                  {[10, 15, 20, 30, 45, 60, 90].map(
                                    (tempo) => (
                                      <option key={tempo} value={tempo}>
                                        {tempo} segundos
                                      </option>
                                    )
                                  )}
                                </select>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="mt-5 rounded-xl border border-fuchsia-300/10 bg-fuchsia-500/[0.04] p-3">
                <p className="text-xs leading-5 text-white/50">
                  As perguntas selecionadas serão utilizadas diretamente.
                  Elas não serão cadastradas novamente, e você poderá definir
                  o tempo individual de cada rodada.
                </p>
              </div>
            </section>
          )}

          {/* MODO PERGUNTAS PRÓPRIAS */}
          {modoPerguntas === "proprias" && (
            <section className="rounded-3xl border border-white/[0.09] bg-white/[0.045] p-5 shadow-2xl shadow-black/30 backdrop-blur-xl sm:p-6">
              <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10 ring-1 ring-violet-300/15">
                    <Pencil size={19} className="text-violet-300" />
                  </div>

                  <div>
                    <h2 className="font-bold">
                      Suas perguntas
                      <span className="ml-2 text-white/25">
                        {perguntas.length}
                      </span>
                    </h2>

                    <p className="text-xs text-white/35">
                      Crie enunciados e alternativas para a partida.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={adicionarPergunta}
                  disabled={loadingTemas || temas.length === 0}
                  className="flex h-10 items-center justify-center gap-2 rounded-xl border border-fuchsia-400/25 bg-fuchsia-500/10 px-4 text-xs font-bold text-fuchsia-100 transition hover:-translate-y-0.5 hover:border-fuchsia-300/50 hover:bg-fuchsia-500/20 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Plus size={16} />
                  Adicionar pergunta
                </button>
              </div>

              {perguntas.length === 0 && (
                <div className="rounded-2xl border border-dashed border-fuchsia-300/15 bg-gradient-to-br from-fuchsia-500/[0.05] to-transparent px-6 py-14 text-center">
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

              <div className="space-y-6">
                {perguntas.map((pergunta, perguntaIndex) => (
                  <div
                    key={perguntaIndex}
                    className="rounded-2xl border border-white/10 bg-black/20 p-5 shadow-inner shadow-white/[0.02] transition hover:border-violet-400/20"
                  >
                    <div className="mb-5 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-fuchsia-500/25 to-violet-500/10 text-xs font-black text-fuchsia-200 ring-1 ring-fuchsia-300/20">
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
                      <div>
                        <label
                          htmlFor={`enunciado-${perguntaIndex}`}
                          className="mb-2 block text-xs font-bold text-white/60"
                        >
                          Enunciado
                        </label>

                        <textarea
                          id={`enunciado-${perguntaIndex}`}
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
                          className="w-full resize-none rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm outline-none transition placeholder:text-white/20 focus:border-fuchsia-400/50 focus:ring-4 focus:ring-fuchsia-400/5"
                        />
                      </div>

                      <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                          <label
                            htmlFor={`tema-${perguntaIndex}`}
                            className="mb-2 block text-xs font-bold text-white/60"
                          >
                            Tema
                          </label>

                          <div className="relative">
                            <select
                              id={`tema-${perguntaIndex}`}
                              value={pergunta.temaId}
                              onChange={(e) =>
                                alterarPergunta(
                                  perguntaIndex,
                                  "temaId",
                                  Number(e.target.value)
                                )
                              }
                              className="h-11 w-full appearance-none rounded-xl border border-white/10 bg-[#10101d] px-4 pr-10 text-sm outline-none transition focus:border-fuchsia-400/50"
                            >
                              <option value={0}>
                                Selecione um tema
                              </option>

                              {temas.map((tema) => (
                                <option key={tema.id} value={tema.id}>
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
                          <label
                            htmlFor={`tempo-proprio-${perguntaIndex}`}
                            className="mb-2 block text-xs font-bold text-white/60"
                          >
                            Tempo para responder
                          </label>

                          <div className="relative">
                            <Clock3
                              size={16}
                              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-white/30"
                            />

                            <select
                              id={`tempo-proprio-${perguntaIndex}`}
                              value={pergunta.tempoLimite}
                              onChange={(e) =>
                                alterarPergunta(
                                  perguntaIndex,
                                  "tempoLimite",
                                  Number(e.target.value)
                                )
                              }
                              className="h-11 w-full appearance-none rounded-xl border border-white/10 bg-[#10101d] pl-11 pr-10 text-sm outline-none transition focus:border-fuchsia-400/50"
                            >
                              {[10, 15, 20, 30, 45, 60, 90].map((tempo) => (
                                <option key={tempo} value={tempo}>
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

                      <div>
                        <div className="mb-3 flex items-center justify-between gap-3">
                          <label className="text-xs font-bold text-white/60">
                            Alternativas
                          </label>

                          <span className="text-[10px] text-white/25">
                            Marque a resposta correta
                          </span>
                        </div>

                        <div className="grid gap-3">
                          {pergunta.alternativas.map(
                            (alternativa, alternativaIndex) => (
                              <div
                                key={`${perguntaIndex}-${alternativaIndex}`}
                                className={`flex items-center gap-3 rounded-xl border p-2 transition ${
                                  alternativa.correta
                                    ? "border-emerald-400/40 bg-emerald-500/[0.08]"
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
                                  aria-label={`Marcar alternativa ${String.fromCharCode(
                                    65 + alternativaIndex
                                  )} como correta`}
                                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border text-xs font-black transition ${
                                    alternativa.correta
                                      ? "border-emerald-400/40 bg-emerald-500/15 text-emerald-300"
                                      : "border-white/10 bg-white/[0.03] text-white/30 hover:border-violet-400/30 hover:text-violet-300"
                                  }`}
                                >
                                  {alternativa.correta ? (
                                    <Check size={15} />
                                  ) : (
                                    String.fromCharCode(65 + alternativaIndex)
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
          )}

          {/* RESUMO */}
          <section className="rounded-3xl border border-white/[0.09] bg-white/[0.045] p-5 shadow-2xl shadow-black/30 backdrop-blur-xl">
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
                <p className="mt-2 text-xl font-black">{maxJogadores}</p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
                <p className="text-[10px] font-bold uppercase tracking-wider text-white/25">
                  Perguntas
                </p>
                <p className="mt-2 text-xl font-black">
                  {quantidadePerguntas}
                </p>
                <p className="mt-1 text-[10px] text-white/30">
                  {modoPerguntas === "banco"
                    ? "Banco de perguntas"
                    : "Perguntas próprias"}
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
                <p className="text-[10px] font-bold uppercase tracking-wider text-white/25">
                  Código
                </p>
                <p className="mt-2 break-all text-xl font-black tracking-widest">
                  {codigo || "---"}
                </p>
              </div>
            </div>
          </section>

          {/* BOTÃO */}
          <div className="flex justify-end border-t border-white/[0.06] pt-6 pb-10">
            <button
              type="button"
              onClick={criarSala}
              disabled={criandoSala || loadingTemas}
              className="flex h-13 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-fuchsia-500 to-violet-600 px-7 text-sm font-black shadow-xl shadow-fuchsia-950/40 transition hover:-translate-y-1 hover:shadow-2xl hover:shadow-fuchsia-950/50 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
            >
              {criandoSala ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
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
