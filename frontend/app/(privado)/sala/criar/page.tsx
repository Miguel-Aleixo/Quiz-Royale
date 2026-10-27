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
  criador?: {
    id: number;
    nome: string;
    role: string;
  } | null;
  alternativas: AlternativaBanco[];
}

interface PerguntaSelecionada {
  perguntaId: number;
  tempoLimite: number;
}

type ModoPerguntas = "banco" | "proprias";

const ITENS_POR_PAGINA = 10;

export default function CriarSalaPage() {
  const router = useRouter();
  const API = process.env.NEXT_PUBLIC_API;

  const [nomeSala, setNomeSala] = useState("");
  const [codigo, setCodigo] = useState("");
  const [maxJogadores, setMaxJogadores] = useState(10);

  const [temas, setTemas] = useState<Tema[]>([]);
  const [perguntas, setPerguntas] = useState<PerguntaForm[]>([]);
  const [perguntasBanco, setPerguntasBanco] = useState<PerguntaBanco[]>([]);
  const [selecionadasBanco, setSelecionadasBanco] = useState<
    PerguntaSelecionada[]
  >([]);

  const [paginaBanco, setPaginaBanco] = useState(1);

  const [modoPerguntas, setModoPerguntas] =
    useState<ModoPerguntas>("banco");

  const [temaFiltro, setTemaFiltro] = useState("todos");
  const [busca, setBusca] = useState("");

  const [loadingTemas, setLoadingTemas] = useState(false);
  const [loadingPerguntas, setLoadingPerguntas] = useState(false);
  const [criandoSala, setCriandoSala] = useState(false);

  const [perguntaExpandida, setPerguntaExpandida] = useState<number | null>(0);
  const [perguntasBancoExpandidas, setPerguntasBancoExpandidas] = useState<
    number[]
  >([]);

  const alternarExpansaoBanco = (id: number) => {
    setPerguntasBancoExpandidas((prev) =>
      prev.includes(id)
        ? prev.filter((item) => item !== id)
        : [...prev, id]
    );
  };

  const headers = useCallback((): HeadersInit => {
    const token = Cookies.get("token");

    return {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  }, []);

  const mensagemErro = (data: unknown, fallback: string) => {
    if (data && typeof data === "object" && "message" in data) {
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
  // BUSCAR PERGUNTAS OFICIAIS DO BANCO
  // =========================================================

  const buscarPerguntasBanco = useCallback(async () => {
    if (!API) {
      toast.error("API não configurada.");
      return;
    }

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
        toast.error(mensagemErro(data, "Erro ao buscar perguntas."));
        return;
      }

      if (!Array.isArray(data)) {
        toast.error("A API retornou um formato inválido de perguntas.");
        return;
      }

      // Exibe somente perguntas cadastradas por administradores.
      const perguntasOficiais = data.filter(
        (pergunta: PerguntaBanco) =>
          typeof pergunta.id === "number" &&
          typeof pergunta.enunciado === "string" &&
          pergunta.criador?.role === "ADMIN" &&
          Array.isArray(pergunta.alternativas)
      );

      setPerguntasBanco(perguntasOficiais);
      setPaginaBanco(1);
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

  // Ao alterar a busca ou o tema, volta para a primeira página.
  useEffect(() => {
    setPaginaBanco(1);
  }, [busca, temaFiltro]);

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

  // Filtra por tema e pelo texto pesquisado.
  const perguntasFiltradas = perguntasBanco.filter((pergunta) => {
    const correspondeTema =
      temaFiltro === "todos" ||
      pergunta.temaId === Number(temaFiltro);

    const correspondeBusca = pergunta.enunciado
      .toLocaleLowerCase("pt-BR")
      .includes(busca.toLocaleLowerCase("pt-BR"));

    return correspondeTema && correspondeBusca;
  });

  // Calcula a quantidade de páginas a partir dos resultados filtrados.
  const totalPaginasBanco = Math.max(
    1,
    Math.ceil(perguntasFiltradas.length / ITENS_POR_PAGINA)
  );

  // Garante que a página atual não ultrapasse o total após alterações.
  const paginaBancoAtual = Math.min(paginaBanco, totalPaginasBanco);

  // Retorna somente as perguntas correspondentes à página atual.
  const perguntasPaginadas = perguntasFiltradas.slice(
    (paginaBancoAtual - 1) * ITENS_POR_PAGINA,
    paginaBancoAtual * ITENS_POR_PAGINA
  );

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

      // 1. Criar sala.
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

      // 2. Preparar as rodadas de acordo com o modo escolhido.
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
          // Cadastrar pergunta própria.
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

          // Cadastrar alternativas.
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

          // Criar rodada.
          await criarRodada(
            perguntaCriada.id,
            sala.id,
            index + 1,
            pergunta.tempoLimite,
            token
          );
        }
      }

      // 3. Entrar automaticamente na sala.
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
    <main className="min-h-screen overflow-x-hidden bg-[#080811] text-white selection:bg-fuchsia-400/30">
      {/* BACKGROUND */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-64 left-1/3 h-[550px] w-[550px] rounded-full bg-fuchsia-600/[0.12] blur-[140px]" />
        <div className="absolute right-[-200px] top-[35%] h-[450px] w-[450px] rounded-full bg-violet-600/[0.10] blur-[130px]" />
        <div className="absolute bottom-[-250px] left-[-150px] h-[500px] w-[500px] rounded-full bg-cyan-500/[0.07] blur-[140px]" />
        <div className="absolute inset-0 opacity-[0.025] [background-image:linear-gradient(rgba(255,255,255,.8)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.8)_1px,transparent_1px)] [background-size:42px_42px]" />
      </div>

      {/* HEADER */}
      <header className="fixed inset-x-0 top-0 z-50 px-3 pt-3 sm:px-6 sm:pt-5">
        <nav className="mx-auto flex h-[66px] max-w-7xl items-center justify-between rounded-2xl border border-white/[0.09] bg-[#10101b]/90 px-4 shadow-2xl shadow-black/30 backdrop-blur-2xl sm:px-6">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              aria-label="Voltar para o início"
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-white/60 transition hover:border-fuchsia-400/40 hover:bg-fuchsia-500/10 hover:text-white"
            >
              <ArrowLeft size={19} />
            </Link>

            <div>
              <p className="text-sm font-black tracking-tight">Criar sala</p>
              <p className="text-[10px] text-white/35">Quiz Royale Studio</p>
            </div>
          </div>

          <Link href="/" className="transition hover:opacity-80">
            <Image
              src="/imagens/logo_dark_menor.png"
              alt="Quiz Royale"
              width={120}
              height={52}
              priority
              className="object-contain"
            />
          </Link>
        </nav>
      </header>

      <div className="relative mx-auto max-w-7xl px-4 pb-12 pt-28 sm:px-6 sm:pt-32 lg:px-8">
        {/* HERO */}
        <section className="relative mb-9 overflow-hidden rounded-[28px] border border-white/[0.09] bg-gradient-to-br from-[#191225] via-[#11101d] to-[#10101a] p-6 sm:p-9 lg:p-10">
          <div className="pointer-events-none absolute -right-10 -top-20 h-72 w-72 rounded-full bg-fuchsia-500/[0.12] blur-[90px]" />
          <div className="pointer-events-none absolute bottom-[-100px] right-[25%] h-48 w-48 rounded-full bg-violet-500/[0.10] blur-[80px]" />

          <div className="relative flex flex-col justify-between gap-7 md:flex-row md:items-center">
            <div className="max-w-2xl">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-fuchsia-300/20 bg-fuchsia-400/[0.08] px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-fuchsia-200">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-fuchsia-300" />
                Arena de criação
              </div>

              <h1 className="text-3xl font-black leading-tight tracking-tight sm:text-5xl">
                Monte sua
                <span className="block bg-gradient-to-r from-fuchsia-300 via-violet-300 to-cyan-200 bg-clip-text text-transparent">
                  próxima batalha.
                </span>
              </h1>

              <p className="mt-4 max-w-lg text-sm leading-6 text-white/45">
                Personalize sua sala, escolha os desafios e prepare suas
                perguntas. Cada detalhe conta para uma grande partida.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 md:min-w-[230px] md:grid-cols-1">
              <div className="rounded-2xl border border-white/[0.09] bg-black/20 p-4">
                <div className="flex items-center gap-2 text-white/40">
                  <Users size={15} />
                  <span className="text-[10px] font-bold uppercase tracking-wider">
                    Jogadores
                  </span>
                </div>
                <p className="mt-2 text-3xl font-black">
                  {maxJogadores}
                  <span className="ml-2 text-xs font-medium text-white/35">
                    máx.
                  </span>
                </p>
              </div>

              <div className="rounded-2xl border border-white/[0.09] bg-black/20 p-4">
                <div className="flex items-center gap-2 text-white/40">
                  <BookOpen size={15} />
                  <span className="text-[10px] font-bold uppercase tracking-wider">
                    Desafios
                  </span>
                </div>
                <p className="mt-2 text-3xl font-black">
                  {quantidadePerguntas}
                  <span className="ml-2 text-xs font-medium text-white/35">
                    perguntas
                  </span>
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CONFIGURAÇÕES */}
        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_310px]">
          <div className="min-w-0 space-y-6">
            <section className="rounded-3xl border border-white/[0.08] bg-[#11111c]/80 p-5 shadow-xl shadow-black/10 backdrop-blur-xl sm:p-7">
              <div className="mb-6 flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-fuchsia-300/15 bg-fuchsia-500/10 text-fuchsia-300">
                  <Gamepad2 size={21} />
                </div>
                <div>
                  <h2 className="font-bold">Configurações da sala</h2>
                  <p className="mt-1 text-xs text-white/35">
                    Comece definindo sua arena.
                  </p>
                </div>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label
                    htmlFor="nome-sala"
                    className="mb-2 block text-xs font-bold text-white/60"
                  >
                    Nome da sala
                  </label>
                  <input
                    id="nome-sala"
                    value={nomeSala}
                    onChange={(e) => setNomeSala(e.target.value)}
                    maxLength={80}
                    placeholder="Ex.: Desafio dos campeões"
                    className="h-12 w-full rounded-xl border border-white/10 bg-black/20 px-4 text-sm transition placeholder:text-white/20 focus:border-fuchsia-400/50 focus:bg-fuchsia-500/[0.03] focus:outline-none focus:ring-4 focus:ring-fuchsia-400/[0.06]"
                  />
                  <p className="mt-2 text-right text-[10px] text-white/25">
                    {nomeSala.length}/80 caracteres
                  </p>
                </div>

                <div className="sm:col-span-2">
                  <label
                    htmlFor="max-jogadores"
                    className="mb-3 block text-xs font-bold text-white/60"
                  >
                    Capacidade da arena
                  </label>

                  <div className="grid grid-cols-4 gap-2 sm:grid-cols-8">
                    {[2, 5, 10, 15, 20, 30, 40, 50].map((quantidade) => (
                      <button
                        key={quantidade}
                        type="button"
                        onClick={() => setMaxJogadores(quantidade)}
                        className={`rounded-xl cursor-pointer border py-3 text-sm font-bold transition hover:-translate-y-0.5 ${
                          maxJogadores === quantidade
                            ? "border-fuchsia-400/50 bg-fuchsia-500/15 text-fuchsia-200 shadow-lg shadow-fuchsia-950/20"
                            : "border-white/[0.08] bg-white/[0.02] text-white/45 hover:border-white/20 hover:text-white"
                        }`}
                      >
                        {quantidade}
                      </button>
                    ))}
                  </div>

                  <input
                    id="max-jogadores"
                    type="hidden"
                    value={maxJogadores}
                    readOnly
                  />

                  <p className="mt-3 text-[11px] text-white/30">
                    <Users size={13} className="mr-1 inline" />
                    Até {maxJogadores} participantes poderão entrar na sala.
                  </p>
                </div>
              </div>
            </section>

            {/* MODO */}
            <section className="rounded-3xl border border-white/[0.08] bg-[#11111c]/80 p-5 backdrop-blur-xl sm:p-7">
              <div className="mb-5">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-fuchsia-300">
                  01 / Método
                </p>
                <h2 className="mt-2 text-lg font-bold">
                  Como vamos montar o desafio?
                </h2>
                <p className="mt-1 text-xs text-white/35">
                  Escolha de onde virão as perguntas.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => setModoPerguntas("banco")}
                  className={`group relative cursor-pointer overflow-hidden rounded-2xl border p-5 text-left transition duration-300 hover:-translate-y-1 ${
                    modoPerguntas === "banco"
                      ? "border-fuchsia-400/40 bg-gradient-to-br from-fuchsia-500/[0.12] to-violet-500/[0.04] shadow-lg shadow-fuchsia-950/10"
                      : "border-white/[0.08] bg-black/20 hover:border-white/20"
                  }`}
                >
                  {modoPerguntas === "banco" && (
                    <div className="absolute right-0 top-0 h-20 w-20 rounded-full bg-fuchsia-400/10 blur-2xl" />
                  )}

                  <div className="relative flex items-start justify-between">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-fuchsia-300/15 bg-fuchsia-500/10 text-fuchsia-300 transition group-hover:scale-105">
                      <Database size={22} />
                    </div>

                    <span
                      className={`flex h-6 w-6 items-center justify-center rounded-full border transition ${
                        modoPerguntas === "banco"
                          ? "border-fuchsia-300 bg-fuchsia-400 text-[#170d22]"
                          : "border-white/15 text-transparent"
                      }`}
                    >
                      <Check size={14} />
                    </span>
                  </div>

                  <h3 className="relative mt-4 font-bold">
                    Banco de perguntas
                  </h3>
                  <p className="relative mt-2 text-xs leading-5 text-white/40">
                    Explore os desafios cadastrados e escolha os melhores para
                    sua partida.
                  </p>
                  <p className="relative mt-4 text-xs font-bold text-fuchsia-300">
                    {perguntasBanco.length} disponíveis
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setModoPerguntas("proprias")}
                  className={`group cursor-pointer relative overflow-hidden rounded-2xl border p-5 text-left transition duration-300 hover:-translate-y-1 ${
                    modoPerguntas === "proprias"
                      ? "border-violet-400/40 bg-gradient-to-br from-violet-500/[0.12] to-fuchsia-500/[0.04] shadow-lg shadow-violet-950/10"
                      : "border-white/[0.08] bg-black/20 hover:border-white/20"
                  }`}
                >
                  {modoPerguntas === "proprias" && (
                    <div className="absolute right-0 top-0 h-20 w-20 rounded-full bg-violet-400/10 blur-2xl" />
                  )}

                  <div className="relative flex items-start justify-between">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-violet-300/15 bg-violet-500/10 text-violet-300 transition group-hover:scale-105">
                      <Pencil size={22} />
                    </div>

                    <span
                      className={`flex h-6 w-6 items-center justify-center rounded-full border transition ${
                        modoPerguntas === "proprias"
                          ? "border-violet-300 bg-violet-400 text-[#170d22]"
                          : "border-white/15 text-transparent"
                      }`}
                    >
                      <Check size={14} />
                    </span>
                  </div>

                  <h3 className="relative mt-4 font-bold">Criar do zero</h3>
                  <p className="relative mt-2 text-xs leading-5 text-white/40">
                    Escreva suas próprias perguntas e prepare alternativas
                    exclusivas.
                  </p>
                  <p className="relative mt-4 text-xs font-bold text-violet-300">
                    {perguntas.length} criadas
                  </p>
                </button>
              </div>
            </section>

            {/* BANCO DE PERGUNTAS */}
            {modoPerguntas === "banco" && (
              <section className="rounded-3xl border border-white/[0.08] bg-[#11111c]/80 p-5 backdrop-blur-xl sm:p-7">
                <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-fuchsia-300">
                      02 / Seleção
                    </p>
                    <h2 className="mt-2 text-lg font-bold">
                      Monte seu questionário
                    </h2>
                    <p className="mt-1 text-xs text-white/35">
                      Expanda um card para conferir as alternativas e
                      configurar o tempo.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={buscarPerguntasBanco}
                    disabled={loadingPerguntas}
                    className="inline-flex cursor-pointer h-10 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-4 text-xs font-bold text-white/65 transition hover:border-fuchsia-300/30 hover:text-fuchsia-200 disabled:opacity-50"
                  >
                    <Search
                      size={15}
                      className={loadingPerguntas ? "animate-pulse" : ""}
                    />
                    Atualizar
                  </button>
                </div>

                {/* BUSCA E FILTRO */}
                <div className="mb-5 grid gap-3 sm:grid-cols-[1fr_200px]">
                  <div className="relative">
                    <Search
                      size={16}
                      className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-white/30"
                    />
                    <input
                      value={busca}
                      maxLength={80}
                      onChange={(e) => setBusca(e.target.value)}
                      placeholder="Pesquisar desafios..."
                      className="h-11 w-full rounded-xl border border-white/10 bg-black/20 pl-10 pr-4 text-sm outline-none transition placeholder:text-white/25 focus:border-fuchsia-400/50"
                    />
                  </div>

                  <div className="relative">
                    <select
                      value={temaFiltro}
                      onChange={(e) => setTemaFiltro(e.target.value)}
                      className="h-11 w-full cursor-pointer appearance-none rounded-xl border border-white/10 bg-[#10101d] px-4 pr-10 text-sm text-white/70 outline-none focus:border-fuchsia-400/50"
                    >
                      <option value="todos">Todos os temas</option>
                      {temas.map((tema) => (
                        <option key={tema.id} value={tema.id}>
                          {tema.nome}
                        </option>
                      ))}
                    </select>

                    <ChevronDown
                      size={15}
                      className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-white/35"
                    />
                  </div>
                </div>

                {/* CONTADOR DE SELECIONADAS */}
                <div className="mb-5 flex items-center justify-between rounded-xl border border-fuchsia-300/10 bg-fuchsia-500/[0.04] px-4 py-3">
                  <div>
                    <p className="text-xs font-bold text-white/75">
                      Perguntas selecionadas
                    </p>
                    <p className="mt-1 text-[10px] text-white/35">
                      As selecionadas serão usadas nesta sala.
                    </p>
                  </div>

                  <span className="flex h-9 min-w-9 items-center justify-center rounded-xl border border-fuchsia-300/20 bg-fuchsia-400/10 px-2 text-sm font-black text-fuchsia-200">
                    {selecionadasBanco.length}
                  </span>
                </div>

                {/* LISTA DE PERGUNTAS */}
                {loadingPerguntas && perguntasBanco.length === 0 ? (
                  <div className="rounded-2xl border border-white/[0.08] bg-black/20 px-5 py-14 text-center">
                    <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-fuchsia-300/20 border-t-fuchsia-300" />
                    <p className="text-sm text-white/50">
                      Preparando o banco de perguntas...
                    </p>
                  </div>
                ) : perguntasFiltradas.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-white/15 px-5 py-14 text-center">
                    <BookOpen
                      size={28}
                      className="mx-auto mb-3 text-white/20"
                    />
                    <p className="text-sm font-bold text-white/65">
                      Nenhum desafio encontrado
                    </p>
                    <p className="mt-2 text-xs text-white/35">
                      Tente outra busca ou selecione um tema diferente.
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="space-y-3">
                      {perguntasPaginadas.map((pergunta, index) => {
                        const selecionada = perguntaEstaSelecionada(
                          pergunta.id
                        );

                        const configuracao = selecionadasBanco.find(
                          (item) => item.perguntaId === pergunta.id
                        );

                        const expandida = perguntasBancoExpandidas.includes(
                          pergunta.id
                        );

                        const temaNome =
                          pergunta.tema?.nome ??
                          temas.find((t) => t.id === pergunta.temaId)?.nome ??
                          "Sem tema";

                        // Mantém a numeração contínua entre as páginas.
                        const numeroPergunta =
                          (paginaBancoAtual - 1) * ITENS_POR_PAGINA +
                          index +
                          1;

                        return (
                          <article
                            key={pergunta.id}
                            className={`overflow-hidden rounded-2xl border transition-all duration-300 ${
                              selecionada
                                ? "border-fuchsia-400/35 bg-gradient-to-r from-fuchsia-500/[0.07] to-violet-500/[0.025]"
                                : "border-white/[0.08] bg-black/20 hover:border-white/15"
                            }`}
                          >
                            <div className="flex items-start gap-3 p-4 sm:p-5">
                              <button
                                type="button"
                                onClick={() =>
                                  alternarPerguntaBanco(pergunta.id)
                                }
                                aria-label={
                                  selecionada
                                    ? "Desmarcar pergunta"
                                    : "Selecionar pergunta"
                                }
                                className={`mt-1 cursor-pointer flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border transition ${
                                  selecionada
                                    ? "border-fuchsia-400 bg-fuchsia-500 text-white"
                                    : "border-white/20 text-transparent hover:border-fuchsia-300/60"
                                }`}
                              >
                                <Check size={14} />
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  alternarExpansaoBanco(pergunta.id)
                                }
                                aria-expanded={expandida}
                                className="min-w-0 flex-1 text-left"
                              >
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="rounded-md border border-violet-300/15 bg-violet-400/[0.07] px-2 py-1 text-[10px] font-bold text-violet-200">
                                    {temaNome}
                                  </span>

                                  <span className="text-[10px] text-white/30">
                                    {pergunta.alternativas.length} alternativas
                                  </span>

                                  {selecionada && (
                                    <span className="rounded-md bg-fuchsia-400/10 px-2 py-1 text-[9px] font-black uppercase tracking-wider text-fuchsia-200">
                                      Selecionada
                                    </span>
                                  )}
                                </div>

                                <p className="mt-3 break-words text-sm font-semibold leading-6 text-white/85">
                                  <span className="mr-2 text-xs font-black text-white/25">
                                    {String(numeroPergunta).padStart(2, "0")}
                                  </span>
                                  {pergunta.enunciado}
                                </p>
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  alternarExpansaoBanco(pergunta.id)
                                }
                                aria-label={
                                  expandida
                                    ? "Recolher pergunta"
                                    : "Expandir pergunta"
                                }
                                className={`flex cursor-pointer h-9 w-9 shrink-0 items-center justify-center rounded-xl border transition ${
                                  expandida
                                    ? "rotate-180 border-fuchsia-300/20 bg-fuchsia-400/10 text-fuchsia-200"
                                    : "border-white/[0.08] text-white/40 hover:text-white"
                                }`}
                              >
                                <ChevronDown size={17} />
                              </button>
                            </div>

                            {/* CONTEÚDO EXPANDIDO */}
                            {expandida && (
                              <div className="animate-in fade-in slide-in-from-top-2 border-t border-white/[0.07] px-4 pb-4 pt-4 duration-200 sm:px-5 sm:pb-5">
                                <p className="mb-3 text-[10px] font-black uppercase tracking-[0.16em] text-white/35">
                                  Alternativas da pergunta
                                </p>

                                <div className="grid gap-2 sm:grid-cols-2">
                                  {pergunta.alternativas.map(
                                    (alternativa, alternativaIndex) => (
                                      <div
                                        key={alternativa.id}
                                        className={`flex items-start gap-3 rounded-xl border p-3 text-xs leading-5 ${
                                          alternativa.correta
                                            ? "border-emerald-400/20 bg-emerald-500/[0.07] text-emerald-200"
                                            : "border-white/[0.06] bg-white/[0.02] text-white/50"
                                        }`}
                                      >
                                        <span
                                          className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-[10px] font-black ${
                                            alternativa.correta
                                              ? "bg-emerald-400/15 text-emerald-300"
                                              : "bg-white/[0.05] text-white/35"
                                          }`}
                                        >
                                          {alternativa.correta ? (
                                            <Check size={13} />
                                          ) : (
                                            String.fromCharCode(
                                              65 + alternativaIndex
                                            )
                                          )}
                                        </span>

                                        <span className="break-words pt-0.5">
                                          {alternativa.texto}
                                        </span>
                                      </div>
                                    )
                                  )}
                                </div>

                                {selecionada && (
                                  <div className="mt-4 flex flex-col gap-3 rounded-xl border border-fuchsia-300/10 bg-fuchsia-500/[0.04] p-3 sm:flex-row sm:items-center">
                                    <div className="flex items-center gap-2 text-fuchsia-200">
                                      <Clock3 size={16} />
                                      <span className="text-xs font-bold">
                                        Tempo para responder
                                      </span>
                                    </div>

                                    <select
                                      aria-label={`Tempo da pergunta ${pergunta.id}`}
                                      value={configuracao?.tempoLimite ?? 30}
                                      onChange={(e) =>
                                        alterarTempoBanco(
                                          pergunta.id,
                                          Number(e.target.value)
                                        )
                                      }
                                      className="h-10 rounded-lg border border-white/10 bg-[#10101d] px-3 text-xs outline-none focus:border-fuchsia-400/50 sm:ml-auto"
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

                                {!selecionada && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      alternarPerguntaBanco(pergunta.id)
                                    }
                                    className="mt-4 cursor-pointer flex w-full items-center justify-center gap-2 rounded-xl border border-fuchsia-300/20 bg-fuchsia-500/[0.07] py-3 text-xs font-bold text-fuchsia-200 transition hover:bg-fuchsia-500/[0.14]"
                                  >
                                    <Plus size={15} />
                                    Adicionar à partida
                                  </button>
                                )}
                              </div>
                            )}
                          </article>
                        );
                      })}
                    </div>

                    {/* PAGINAÇÃO */}
                    {perguntasFiltradas.length > 0 && (
                      <div className="mt-5 flex flex-col gap-3 rounded-2xl border border-white/[0.08] bg-black/20 p-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="text-xs font-bold text-white/70">
                            Página {paginaBancoAtual} de {totalPaginasBanco}
                          </p>

                          <p className="mt-1 text-[10px] text-white/35">
                            {perguntasFiltradas.length}{" "}
                            {perguntasFiltradas.length === 1
                              ? "pergunta encontrada"
                              : "perguntas encontradas"}
                          </p>

                          <p className="mt-1 text-[10px] text-white/25">
                            Exibindo{" "}
                            {(paginaBancoAtual - 1) * ITENS_POR_PAGINA + 1}
                            {"–"}
                            {Math.min(
                              paginaBancoAtual * ITENS_POR_PAGINA,
                              perguntasFiltradas.length
                            )}{" "}
                            de {perguntasFiltradas.length}
                          </p>
                        </div>

                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              setPaginaBanco((pagina) =>
                                Math.max(1, pagina - 1)
                              )
                            }
                            disabled={paginaBancoAtual <= 1}
                            className="flex-1 cursor-pointer rounded-xl border border-white/10 px-4 py-2.5 text-xs font-bold text-white/70 transition hover:border-fuchsia-300/30 hover:bg-fuchsia-500/[0.06] hover:text-white disabled:cursor-not-allowed disabled:opacity-30 sm:flex-none"
                          >
                            Anterior
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              setPaginaBanco((pagina) =>
                                Math.min(totalPaginasBanco, pagina + 1)
                              )
                            }
                            disabled={paginaBancoAtual >= totalPaginasBanco}
                            className="flex-1 cursor-pointer rounded-xl border border-fuchsia-300/20 bg-fuchsia-500/[0.08] px-4 py-2.5 text-xs font-bold text-fuchsia-200 transition hover:bg-fuchsia-500/[0.15] disabled:cursor-not-allowed disabled:opacity-30 sm:flex-none"
                          >
                            Próxima
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                )}

                <p className="mt-5 text-[11px] leading-5 text-white/30">
                  As perguntas são reutilizadas diretamente do banco. Você
                  pode ajustar o tempo individualmente sem cadastrá-las
                  novamente.
                </p>
              </section>
            )}

            {/* PERGUNTAS PRÓPRIAS */}
            {modoPerguntas === "proprias" && (
              <section className="rounded-3xl border border-white/[0.08] bg-[#11111c]/80 p-5 backdrop-blur-xl sm:p-7">
                <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-violet-300">
                      02 / Editor
                    </p>
                    <h2 className="mt-2 text-lg font-bold">
                      Crie seus desafios
                    </h2>
                    <p className="mt-1 text-xs text-white/35">
                      Cada card representa uma rodada da sua partida.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      adicionarPergunta();
                      setPerguntaExpandida(perguntas.length);
                    }}
                    disabled={loadingTemas || temas.length === 0}
                    className="inline-flex cursor-pointer h-11 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-fuchsia-500 to-violet-600 px-5 text-xs font-black shadow-lg shadow-fuchsia-950/20 transition hover:-translate-y-0.5 hover:shadow-fuchsia-900/30 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <Plus size={17} />
                    Nova pergunta
                  </button>
                </div>

                {temas.length === 0 && !loadingTemas && (
                  <div className="mb-4 rounded-xl border border-amber-300/15 bg-amber-400/[0.05] p-3 text-xs leading-5 text-amber-100/70">
                    Nenhum tema disponível. Cadastre um tema antes de criar
                    suas perguntas.
                  </div>
                )}

                {perguntas.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-violet-300/20 bg-gradient-to-br from-violet-500/[0.06] to-transparent px-6 py-14 text-center">
                    <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-violet-300/15 bg-violet-400/[0.08] text-violet-200">
                      <BookOpen size={25} />
                    </div>

                    <p className="text-sm font-bold text-white/75">
                      Sua arena começa aqui
                    </p>
                    <p className="mx-auto mt-2 max-w-xs text-xs leading-5 text-white/35">
                      Crie sua primeira pergunta e transforme seu conhecimento
                      em um desafio.
                    </p>

                    <button
                      type="button"
                      onClick={() => {
                        adicionarPergunta();
                        setPerguntaExpandida(0);
                      }}
                      disabled={loadingTemas || temas.length === 0}
                      className="mt-5 cursor-pointer inline-flex items-center gap-2 rounded-xl border border-violet-300/20 bg-violet-500/10 px-4 py-3 text-xs font-bold text-violet-200 transition hover:bg-violet-500/20 disabled:opacity-40"
                    >
                      <Plus size={15} />
                      Criar primeira pergunta
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {perguntas.map((pergunta, perguntaIndex) => {
                      const expandida = perguntaExpandida === perguntaIndex;

                      const preenchidas = pergunta.alternativas.filter(
                        (a) => a.texto.trim()
                      ).length;

                      const temCorreta = pergunta.alternativas.some(
                        (a) => a.correta
                      );

                      const temaNome =
                        temas.find(
                          (t) => t.id === Number(pergunta.temaId)
                        )?.nome ?? "Tema não selecionado";

                      return (
                        <article
                          key={perguntaIndex}
                          className={`overflow-hidden rounded-2xl border transition-all duration-300 ${
                            expandida
                              ? "border-violet-400/30 bg-gradient-to-br from-violet-500/[0.06] to-transparent shadow-xl shadow-violet-950/10"
                              : "border-white/[0.08] bg-black/20 hover:border-white/15"
                          }`}
                        >
                          {/* CABEÇALHO EXPANSÍVEL */}
                          <div className="flex items-center gap-3 p-4 sm:p-5">
                            <button
                              type="button"
                              onClick={() =>
                                setPerguntaExpandida(
                                  expandida ? null : perguntaIndex
                                )
                              }
                              aria-expanded={expandida}
                              className="flex cursor-pointer min-w-0 flex-1 items-center gap-3 text-left"
                            >
                              <div
                                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border text-sm font-black transition ${
                                  expandida
                                    ? "border-violet-300/30 bg-violet-400/15 text-violet-200"
                                    : "border-white/[0.08] bg-white/[0.03] text-white/45"
                                }`}
                              >
                                {String(perguntaIndex + 1).padStart(2, "0")}
                              </div>

                              <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-bold text-white/85">
                                  {pergunta.enunciado.trim() ||
                                    "Pergunta sem título"}
                                </p>

                                <div className="mt-2 flex flex-wrap items-center gap-2">
                                  <span className="max-w-full truncate rounded-md border border-violet-300/10 bg-violet-400/[0.06] px-2 py-1 text-[9px] font-bold text-violet-200/80">
                                    {temaNome}
                                  </span>

                                  <span className="inline-flex items-center gap-1 text-[10px] text-white/35">
                                    <Clock3 size={11} />
                                    {pergunta.tempoLimite}s
                                  </span>

                                  <span
                                    className={`text-[10px] ${
                                      temCorreta &&
                                      preenchidas ===
                                        pergunta.alternativas.length
                                        ? "text-emerald-300"
                                        : "text-white/30"
                                    }`}
                                  >
                                    {preenchidas}/
                                    {pergunta.alternativas.length} alternativas
                                  </span>
                                </div>
                              </div>

                              <ChevronDown
                                size={17}
                                className={`shrink-0 text-white/40 transition-transform duration-300 ${
                                  expandida
                                    ? "rotate-180 text-violet-200"
                                    : ""
                                }`}
                              />
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                removerPergunta(perguntaIndex);
                                setPerguntaExpandida((atual) => {
                                  if (atual === null) return null;
                                  if (atual === perguntaIndex) return null;
                                  return atual > perguntaIndex
                                    ? atual - 1
                                    : atual;
                                });
                              }}
                              aria-label={`Excluir pergunta ${
                                perguntaIndex + 1
                              }`}
                              className="flex cursor-pointer h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-transparent text-white/30 transition hover:border-red-400/15 hover:bg-red-400/10 hover:text-red-300"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>

                          {/* CONTEÚDO EXPANDIDO */}
                          {expandida && (
                            <div className="animate-in fade-in slide-in-from-top-2 border-t border-white/[0.07] p-4 duration-200 sm:p-5">
                              <div className="space-y-5">
                                <div>
                                  <div className="mb-2 flex items-center justify-between gap-3">
                                    <label
                                      htmlFor={`enunciado-${perguntaIndex}`}
                                      className="text-xs font-bold text-white/65"
                                    >
                                      Enunciado
                                    </label>
                                    <span className="text-[10px] text-white/25">
                                      Pergunta {perguntaIndex + 1}
                                    </span>
                                  </div>

                                  <textarea
                                    id={`enunciado-${perguntaIndex}`}
                                    value={pergunta.enunciado}
                                    maxLength={300}
                                    onChange={(e) =>
                                      alterarPergunta(
                                        perguntaIndex,
                                        "enunciado",
                                        e.target.value
                                      )
                                    }
                                    placeholder="O que você quer perguntar aos jogadores?"
                                    rows={3}
                                    className="w-full resize-y rounded-xl border border-white/10 bg-black/25 px-4 py-3 text-sm leading-6 outline-none transition placeholder:text-white/20 focus:border-violet-400/40 focus:ring-4 focus:ring-violet-400/[0.05]"
                                  />
                                </div>

                                <div className="grid gap-4 sm:grid-cols-2">
                                  <div>
                                    <label
                                      htmlFor={`tema-${perguntaIndex}`}
                                      className="mb-2 block text-xs font-bold text-white/60"
                                    >
                                      Tema da pergunta
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
                                        className="h-11 cursor-pointer w-full appearance-none rounded-xl border border-white/10 bg-[#10101d] px-3 pr-9 text-sm outline-none focus:border-violet-400/50"
                                      >
                                        <option value={0}>
                                          Selecione um tema
                                        </option>

                                        {temas.map((tema) => (
                                          <option
                                            key={tema.id}
                                            value={tema.id}
                                          >
                                            {tema.nome}
                                          </option>
                                        ))}
                                      </select>

                                      <ChevronDown
                                        size={15}
                                        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-white/35"
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
                                        size={15}
                                        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-violet-300/70"
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
                                        className="h-11 w-full cursor-pointer appearance-none rounded-xl border border-white/10 bg-[#10101d] pl-9 pr-9 text-sm outline-none focus:border-violet-400/50"
                                      >
                                        {[10, 15, 20, 30, 45, 60, 90].map(
                                          (tempo) => (
                                            <option key={tempo} value={tempo}>
                                              {tempo} segundos
                                            </option>
                                          )
                                        )}
                                      </select>

                                      <ChevronDown
                                        size={15}
                                        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-white/35"
                                      />
                                    </div>
                                  </div>
                                </div>

                                <div>
                                  <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                                    <div>
                                      <h3 className="text-xs font-bold text-white/70">
                                        Alternativas
                                      </h3>
                                      <p className="mt-1 text-[10px] text-white/30">
                                        Selecione a letra da resposta correta.
                                      </p>
                                    </div>

                                    <span
                                      className={`rounded-lg border px-2.5 py-1.5 text-[10px] font-bold ${
                                        temCorreta
                                          ? "border-emerald-400/20 bg-emerald-400/[0.07] text-emerald-300"
                                          : "border-amber-400/15 bg-amber-400/[0.05] text-amber-200/70"
                                      }`}
                                    >
                                      {temCorreta
                                        ? "Resposta definida"
                                        : "Falta marcar a correta"}
                                    </span>
                                  </div>

                                  <div className="grid gap-3 sm:grid-cols-2">
                                    {pergunta.alternativas.map(
                                      (alternativa, alternativaIndex) => (
                                        <div
                                          key={`${perguntaIndex}-${alternativaIndex}`}
                                          className={`group flex min-w-0 items-center gap-3 rounded-xl border p-3 transition ${
                                            alternativa.correta
                                              ? "border-emerald-400/30 bg-emerald-500/[0.06]"
                                              : "border-white/[0.08] bg-black/20 hover:border-white/15"
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
                                            aria-pressed={alternativa.correta}
                                            className={`flex cursor-pointer h-9 w-9 shrink-0 items-center justify-center rounded-xl border text-xs font-black transition ${
                                              alternativa.correta
                                                ? "border-emerald-400/30 bg-emerald-400/15 text-emerald-300"
                                                : "border-white/10 bg-white/[0.03] text-white/40 hover:border-violet-300/30 hover:text-violet-200"
                                            }`}
                                          >
                                            {alternativa.correta ? (
                                              <Check size={16} />
                                            ) : (
                                              String.fromCharCode(
                                                65 + alternativaIndex
                                              )
                                            )}
                                          </button>

                                          <input
                                            value={alternativa.texto}
                                            maxLength={120}
                                            onChange={(e) =>
                                              alterarAlternativa(
                                                perguntaIndex,
                                                alternativaIndex,
                                                e.target.value
                                              )
                                            }
                                            placeholder={`Escreva a alternativa ${String.fromCharCode(
                                              65 + alternativaIndex
                                            )}...`}
                                            className="h-9 min-w-0 flex-1 bg-transparent text-xs text-white/80 outline-none placeholder:text-white/20"
                                          />
                                        </div>
                                      )
                                    )}
                                  </div>
                                </div>

                                <div className="flex items-center justify-between border-t border-white/[0.07] pt-4">
                                  <span className="text-[10px] text-white/30">
                                    {preenchidas} de{" "}
                                    {pergunta.alternativas.length} alternativas
                                    preenchidas
                                  </span>

                                  <button
                                    type="button"
                                    onClick={() =>
                                      setPerguntaExpandida(null)
                                    }
                                    className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-xs font-bold text-white/60 transition hover:bg-white/[0.04] hover:text-white"
                                  >
                                    <Check size={14} />
                                    Concluir edição
                                  </button>
                                </div>
                              </div>
                            </div>
                          )}
                        </article>
                      );
                    })}
                  </div>
                )}

                {perguntas.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      adicionarPergunta();
                      setPerguntaExpandida(perguntas.length);
                    }}
                    disabled={loadingTemas || temas.length === 0}
                    className="mt-4 flex cursor-pointer w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-violet-300/25 bg-violet-500/[0.035] py-4 text-xs font-bold text-violet-200/80 transition hover:border-violet-300/45 hover:bg-violet-500/[0.08] disabled:opacity-40"
                  >
                    <Plus size={16} />
                    Adicionar outra pergunta
                  </button>
                )}
              </section>
            )}
          </div>

          {/* SIDEBAR: RESUMO */}
          <aside className="space-y-5 lg:sticky lg:top-28">
            <section className="overflow-hidden rounded-3xl border border-white/[0.09] bg-[#11111c]/90 shadow-2xl shadow-black/20 backdrop-blur-xl">
              <div className="border-b border-white/[0.07] p-5">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-fuchsia-300">
                  Visão geral
                </p>
                <h2 className="mt-2 text-lg font-black">Sua partida</h2>
                <p className="mt-1 text-xs text-white/35">
                  Resumo atualizado em tempo real.
                </p>
              </div>

              <div className="space-y-4 p-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-fuchsia-400/[0.08] text-fuchsia-200">
                    <Gamepad2 size={18} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] text-white/35">Nome da sala</p>
                    <p className="mt-1 break-words text-sm font-bold">
                      {nomeSala.trim() || "Sua nova sala"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-400/[0.08] text-violet-200">
                    <Users size={18} />
                  </div>

                  <div>
                    <p className="text-[10px] text-white/35">Capacidade</p>
                    <p className="mt-1 text-sm font-bold">
                      {maxJogadores} jogadores
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-400/[0.08] text-cyan-200">
                    <BookOpen size={18} />
                  </div>

                  <div>
                    <p className="text-[10px] text-white/35">Questionário</p>
                    <p className="mt-1 text-sm font-bold">
                      {quantidadePerguntas}{" "}
                      {quantidadePerguntas === 1 ? "pergunta" : "perguntas"}
                    </p>
                  </div>
                </div>

                <div className="rounded-xl border border-white/[0.07] bg-black/20 p-3">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-[10px] font-bold text-white/40">
                      Preparação
                    </span>
                    <span className="text-[10px] font-bold text-fuchsia-200">
                      {nomeSala.trim() && quantidadePerguntas > 0
                        ? "Em andamento"
                        : "Pendente"}
                    </span>
                  </div>

                  <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
                    <div
                      className={`h-full rounded-full bg-gradient-to-r from-fuchsia-500 to-violet-400 transition-all duration-500 ${
                        nomeSala.trim() && quantidadePerguntas > 0
                          ? "w-full"
                          : nomeSala.trim() || quantidadePerguntas > 0
                            ? "w-1/2"
                            : "w-[8%]"
                      }`}
                    />
                  </div>

                  <p className="mt-2 text-[10px] leading-4 text-white/30">
                    {nomeSala.trim() && quantidadePerguntas > 0
                      ? "Sua configuração está tomando forma."
                      : "Defina o nome e adicione perguntas para preparar a sala."}
                  </p>
                </div>

                {codigo && (
                  <div className="rounded-xl border border-emerald-400/20 bg-emerald-400/[0.05] p-3">
                    <p className="text-[10px] text-emerald-200/60">
                      Código gerado
                    </p>
                    <p className="mt-1 break-all text-xl font-black tracking-[0.2em] text-emerald-200">
                      {codigo}
                    </p>
                  </div>
                )}
              </div>
            </section>

            <section className="rounded-2xl border border-violet-300/10 bg-gradient-to-br from-violet-500/[0.08] to-fuchsia-500/[0.025] p-5">
              <div className="flex items-center gap-2 text-violet-200">
                <Clock3 size={16} />
                <p className="text-xs font-bold">Dica para sua batalha</p>
              </div>

              <p className="mt-3 text-xs leading-5 text-white/40">
                Misture perguntas fáceis e difíceis para deixar a disputa mais
                dinâmica. Revise as alternativas antes de iniciar.
              </p>
            </section>

            <button
              type="button"
              onClick={criarSala}
              disabled={criandoSala || loadingTemas}
              className="flex min-h-14 w-full cursor-pointer items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-fuchsia-500 via-violet-500 to-violet-600 px-5 py-4 text-sm font-black shadow-xl shadow-fuchsia-950/30 transition duration-300 hover:-translate-y-0.5 hover:shadow-2xl hover:shadow-fuchsia-900/25 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {criandoSala ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Criando sua sala...
                </>
              ) : (
                <>
                  <Gamepad2 size={18} />
                  Criar minha sala
                  <ArrowLeft size={16} className="rotate-180" />
                </>
              )}
            </button>

            <p className="text-center text-[10px] leading-5 text-white/25">
              Confira as perguntas e as configurações antes de criar a partida.
            </p>
          </aside>
        </div>
      </div>
    </main>
  );
}