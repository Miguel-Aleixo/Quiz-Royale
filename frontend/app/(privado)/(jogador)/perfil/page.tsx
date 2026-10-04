"use client";

import Link from "next/link";
import {
  ArrowLeft,
  Crown,
  Trophy,
  Gamepad2,
  Target,
  Medal,
  Shield,
  Mail,
  User,
  CalendarDays,
  ChevronRight,
  CircleCheck,
  MailWarning,
  X,
  Lock,
  Save,
} from "lucide-react";
import { useEffect, useState } from "react";
import Cookies from "js-cookie";
import LoadingOverlay from "@/app/components/global/Loading";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface Patente {
  id: number;
  nome: string;
  pontos: number;
}

interface Usuario {
  id: number;
  nome: string;
  email: string;
  emailVerificado: boolean;
  role: "ADMIN" | "JOGADOR";
  patenteId: number | null;
  pontuacao: number;
  patente: Patente | null;
}

interface DadosEdicao {
  nome: string;
  email: string;
  senha: string;
}

export default function PerfilPage() {
  const API = process.env.NEXT_PUBLIC_API;
  const router = useRouter();

  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [patentes, setPatentes] = useState<Patente[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");

  const [editando, setEditando] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [erroEdicao, setErroEdicao] = useState("");
  const [sucessoEdicao, setSucessoEdicao] = useState("");

  const [dadosEdicao, setDadosEdicao] =
    useState<DadosEdicao>({
      nome: "",
      email: "",
      senha: "",
    });

  useEffect(() => {
    buscarDados();
  }, []);

  async function buscarDados() {
    try {
      setLoading(true);
      setErro("");

      if (!API) {
        throw new Error("API não configurada.");
      }

      const token = Cookies.get("token");

      if (!token) {
        throw new Error("Usuário não autenticado.");
      }

      const partesToken = token.split(".");

      if (partesToken.length !== 3) {
        throw new Error("Token inválido.");
      }

      const payload = JSON.parse(
        atob(partesToken[1])
      );

      const usuarioId = Number(payload.sub);

      if (!usuarioId) {
        throw new Error(
          "Usuário não encontrado no token."
        );
      }

      const usuarioResponse = await fetch(
        `${API}/usuario/${usuarioId}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          cache: "no-store",
        }
      );

      const usuarioData =
        await usuarioResponse.json().catch(() => null);

      if (!usuarioResponse.ok) {
        if (usuarioResponse.status === 401) {
          Cookies.remove("token");
          router.push("/login");
          return;
        }

        throw new Error(
          Array.isArray(usuarioData?.message)
            ? usuarioData.message.join(", ")
            : usuarioData?.message ||
            "Não foi possível buscar o usuário."
        );
      }

      const patentesResponse = await fetch(
        `${API}/patente`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          cache: "no-store",
        }
      );

      const patentesData =
        await patentesResponse.json().catch(() => null);

      if (!patentesResponse.ok) {
        throw new Error(
          Array.isArray(patentesData?.message)
            ? patentesData.message.join(", ")
            : patentesData?.message ||
            "Não foi possível buscar as patentes."
        );
      }

      const patentesOrdenadas = [
        ...(patentesData as Patente[]),
      ].sort((a, b) => a.pontos - b.pontos);

      setUsuario(usuarioData as Usuario);
      setPatentes(patentesOrdenadas);
    } catch (error) {
      console.error(
        "Erro ao carregar perfil:",
        error
      );

      setErro(
        error instanceof Error
          ? error.message
          : "Erro ao carregar perfil."
      );
    } finally {
      setLoading(false);
    }

  }

  function abrirEdicao() {
    if (!usuario) return;

    setErroEdicao("");
    setSucessoEdicao("");

    setDadosEdicao({
      nome: usuario.nome,
      email: usuario.email,
      senha: "",
    });

    setEditando(true);

  }

  function fecharEdicao() {
    if (salvando) return;

    setEditando(false);
    setErroEdicao("");
    setSucessoEdicao("");

  }

  async function salvarEdicao() {
    try {
      setSalvando(true);
      setErroEdicao("");
      setSucessoEdicao("");

      if (!API) {
        throw new Error("API não configurada.");
      }

      const token = Cookies.get("token");

      if (!token) {
        throw new Error("Usuário não autenticado.");
      }

      if (!usuario) {
        throw new Error("Usuário não encontrado.");
      }

      const nome = dadosEdicao.nome.trim();
      const email = dadosEdicao.email.trim().toLowerCase();

      if (!nome) {
        throw new Error("O nome não pode ficar vazio.");
      }

      if (!email) {
        throw new Error("O e-mail não pode ficar vazio.");
      }

      const emailMudou =
        email !== usuario.email.toLowerCase();

      const body: {
        nome: string;
        email: string;
        senha?: string;
      } = {
        nome,
        email,
      };

      if (dadosEdicao.senha.trim()) {
        body.senha = dadosEdicao.senha.trim();
      }

      const response = await fetch(
        `${API}/usuario/${usuario.id} `,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token} `,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(body),
        }
      );

      const data =
        await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          Array.isArray(data?.message)
            ? data.message.join(", ")
            : data?.message ||
            "Não foi possível atualizar o perfil."
        );
      }

      setUsuario((atual) => {
        if (!atual) return atual;

        return {
          ...atual,
          nome: data.nome ?? nome,
          email: data.email ?? email,
          emailVerificado:
            emailMudou
              ? false
              : data.emailVerificado ??
              atual.emailVerificado,
        };
      });

      setDadosEdicao({
        nome: data.nome ?? nome,
        email: data.email ?? email,
        senha: "",
      });

      toast.success(
        emailMudou
          ? "Perfil atualizado. Seu novo e-mail precisa ser verificado."
          : "Perfil atualizado com sucesso."
      );

      setTimeout(() => {
        setEditando(false);
        setErroEdicao("");
        setSucessoEdicao("");
      }, 1200);

    } catch (error) {
      console.error(
        "Erro ao editar perfil:",
        error
      );

      const mensagem =
        error instanceof Error
          ? error.message
          : "Não foi possível atualizar o perfil.";

      setErroEdicao(mensagem);

      toast.error(mensagem);

    } finally {
      setSalvando(false);
    }
  }

  const patenteAtual =
    usuario?.patente ??
    patentes.find(
      (patente) =>
        patente.id === usuario?.patenteId
    ) ??
    null;

  const proximaPatente =
    patentes.find(
      (patente) =>
        patente.pontos >
        (usuario?.pontuacao ?? 0)
    ) ?? null;

  let progresso = 0;

  if (usuario && proximaPatente) {
    const pontosAtuais =
      usuario.pontuacao;

    const pontosBase =
      patenteAtual?.pontos ?? 0;

    const intervalo =
      proximaPatente.pontos -
      pontosBase;

    const pontosDentroDaPatente =
      pontosAtuais - pontosBase;

    progresso =
      intervalo > 0
        ? Math.min(
          100,
          Math.max(
            0,
            (pontosDentroDaPatente /
              intervalo) *
            100
          )
        )
        : 0;

  } else if (
    usuario &&
    patenteAtual
  ) {
    progresso = 100;
  }

  const pontosFaltantes =
    usuario && proximaPatente
      ? Math.max(
        0,
        proximaPatente.pontos -
        usuario.pontuacao
      )
      : 0;

  return (<main className="min-h-screen bg-[#070711] text-white selection:bg-fuchsia-400/30"> <LoadingOverlay show={loading} />

    {/* BACKGROUND */}
    <div className="pointer-events-none fixed inset-0 overflow-hidden">
      <div className="absolute left-1/2 top-[-250px] h-[550px] w-[550px] -translate-x-1/2 rounded-full bg-fuchsia-700/15 blur-[140px]" />

      <div className="absolute bottom-[-250px] right-[-150px] h-[500px] w-[500px] rounded-full bg-cyan-700/10 blur-[130px]" />

      <div className="absolute inset-0 opacity-[0.035] [background-image:linear-gradient(rgba(255,255,255,.8)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.8)_1px,transparent_1px)] [background-size:48px_48px]" />
    </div>

    {/* HEADER */}
    <header className="sticky left-0 right-0 top-0 z-50">
      <div className="mx-auto max-w-6xl px-5 pt-5">
        <nav className="flex h-16 items-center justify-between rounded-3xl border border-white/10 bg-[#10101d]/75 px-5 shadow-2xl shadow-black/20 backdrop-blur-xl">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-white/40 transition hover:-translate-x-0.5 hover:border-fuchsia-300/30 hover:bg-fuchsia-500/10 hover:text-fuchsia-100"
            >
              <ArrowLeft size={18} />
            </Link>

            <h1 className="whitespace-nowrap text-lg font-black">
              Meu perfil
            </h1>
          </div>

          <button
            onClick={() => {
              setLoading(true);
              router.push("/");
            }}
            className="flex items-center transition-opacity hover:opacity-80"
          >
            <Image
              src="/imagens/logo_dark_menor.png"
              alt="Logo Quiz Royale"
              width={150}
              height={150}
              className="object-contain"
              priority
            />
          </button>
        </nav>
      </div>
    </header>

    {/* CONTEÚDO */}
    <section className="relative z-10 mx-auto max-w-6xl px-5 py-10">
      {/* ERRO */}
      {erro && (
        <div className="mb-6 rounded-2xl border border-red-500/20 bg-red-500/5 p-4 text-sm text-red-400">
          {erro}
        </div>
      )}

      {/* AVISO DE E-MAIL */}
      {!loading &&
        usuario &&
        !usuario.emailVerificado && (
          <div className="mb-6 overflow-hidden rounded-[2rem] border border-amber-400/20 bg-amber-400/[0.05] shadow-xl shadow-black/20 backdrop-blur-xl">
            <div className="flex flex-col gap-5 p-6 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-amber-300/15 bg-amber-400/10 text-amber-300">
                  <MailWarning size={23} />
                </div>

                <div>
                  <p className="text-sm font-black text-amber-200">
                    E-mail ainda não verificado
                  </p>

                  <p className="mt-1 text-xs leading-5 text-white/35">
                    Verifique seu e-mail para liberar o acesso às partidas.
                  </p>

                  <p className="mt-1 text-xs text-white/20">
                    Enviaremos um novo link de verificação para:
                  </p>

                  <p className="mt-1 text-xs font-bold text-white/50">
                    {usuario.email}
                  </p>
                </div>
              </div>

              <Link
                href={`/verificar-email?email=${encodeURIComponent(
                  usuario.email
                )}`}
                className="flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl border border-amber-300/20 bg-amber-400/10 px-5 text-xs font-black text-amber-200 transition hover:-translate-y-0.5 hover:bg-amber-400/15 hover:text-amber-100"
              >
                <Mail size={15} />
                Verificar e-mail
              </Link>
            </div>
          </div>
        )}

      {/* PERFIL PRINCIPAL */}
      <div className="overflow-hidden rounded-[2rem] border border-white/[0.09] bg-white/[0.045] shadow-2xl shadow-black/30 backdrop-blur-xl">
        {/* Banner */}
        <div className="relative h-44 overflow-hidden bg-gradient-to-r from-fuchsia-900/35 via-violet-900/30 to-cyan-900/20">
          <div className="absolute left-1/2 top-[-180px] h-96 w-96 -translate-x-1/2 rounded-full bg-fuchsia-500/20 blur-3xl" />

          <div className="absolute bottom-4 right-6 flex items-center gap-2 rounded-full border border-white/15 bg-black/25 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-white/60 backdrop-blur">
            <Shield size={12} />

            {loading
              ? "Carregando"
              : usuario?.role === "ADMIN"
                ? "Administrador"
                : "Jogador"}
          </div>
        </div>

        {/* Dados */}
        <div className="relative px-6 pb-7 sm:px-8">
          {/* Avatar */}
          <div className="-mt-14 flex h-28 w-28 items-center justify-center rounded-3xl border-4 border-[#141320] bg-gradient-to-br from-fuchsia-500 to-violet-600 shadow-xl shadow-fuchsia-950/35 ring-1 ring-fuchsia-200/20">
            <User size={48} />
          </div>

          <div className="mt-5 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
            <div>
              <h2 className="text-3xl font-black">
                {loading
                  ? "Carregando..."
                  : usuario?.nome ?? "Usuário"}
              </h2>

              <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-white/30">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="flex items-center gap-2">
                    <Mail size={14} />

                    {loading
                      ? "Carregando..."
                      : usuario?.email ?? "-"}
                  </span>

                  {!loading && usuario && (
                    <>
                      <span className="hidden text-white/10 sm:block">
                        •
                      </span>

                      <span
                        className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-bold ${usuario.emailVerificado
                          ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-300"
                          : "border-amber-400/20 bg-amber-400/10 text-amber-300"
                          }`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${usuario.emailVerificado
                            ? "bg-emerald-400"
                            : "bg-amber-400"
                            }`}
                        />

                        {usuario.emailVerificado
                          ? "E-mail verificado"
                          : "E-mail não verificado"}
                      </span>
                    </>
                  )}
                </div>

                <span className="hidden text-white/10 sm:block">
                  •
                </span>

                <span className="flex items-center gap-2">
                  <CalendarDays size={14} />
                  Membro desde 2026
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={abrirEdicao}
              disabled={!usuario}
              className="flex h-10 cursor-pointer items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 text-xs font-bold text-white/50 transition hover:-translate-y-0.5 hover:border-fuchsia-300/25 hover:bg-fuchsia-500/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
            >
              Editar perfil
              <ChevronRight size={15} />
            </button>
          </div>
        </div>
      </div>

      {/* PATENTE + ESTATÍSTICAS */}
      <div className="mt-6 grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
        {/* PATENTE */}
        <div className="rounded-[2rem] border border-white/[0.09] bg-white/[0.045] p-7 shadow-xl shadow-black/20 backdrop-blur-xl">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/25">
                Patente atual
              </p>

              <h3 className="mt-2 text-3xl font-black">
                {loading
                  ? "Carregando..."
                  : patenteAtual?.nome ??
                  "Sem classificação"}
              </h3>
            </div>

            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-400/10 text-amber-200 ring-1 ring-amber-300/20 shadow-lg shadow-amber-950/20">
              <Crown size={27} />
            </div>
          </div>

          <div className="mt-6 flex items-end justify-between">
            <div>
              <p className="text-xs text-white/25">
                Pontuação
              </p>

              <p className="mt-1 text-2xl font-black text-fuchsia-200">
                {loading
                  ? "..."
                  : usuario?.pontuacao.toLocaleString(
                    "pt-BR"
                  ) ?? 0}
              </p>
            </div>

            {patenteAtual && (
              <div className="text-right">
                <p className="text-xs text-white/25">
                  Necessários
                </p>

                <p className="mt-1 text-sm font-bold">
                  {patenteAtual.pontos.toLocaleString(
                    "pt-BR"
                  )}{" "}
                  pts
                </p>
              </div>
            )}
          </div>

          {proximaPatente ? (
            <div className="mt-8">
              <div className="mb-2 flex justify-between text-xs">
                <span className="text-white/30">
                  Progresso para{" "}
                  {proximaPatente.nome}
                </span>

                <span className="font-bold text-fuchsia-200">
                  {Math.round(progresso)}%
                </span>
              </div>

              <div className="h-2 overflow-hidden rounded-full bg-white/5">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-fuchsia-400 via-violet-400 to-cyan-300 shadow-[0_0_16px_rgba(217,70,239,.55)] transition-all duration-700"
                  style={{
                    width: `${progresso}%`,
                  }}
                />
              </div>

              <p className="mt-3 text-xs text-white/20">
                Faltam{" "}
                <span className="font-bold text-white/40">
                  {pontosFaltantes.toLocaleString(
                    "pt-BR"
                  )}
                </span>{" "}
                pontos para{" "}
                {proximaPatente.nome}.
              </p>
            </div>
          ) : (
            <div className="mt-8 rounded-2xl border border-amber-300/15 bg-amber-400/10 p-4">
              <div className="flex items-center gap-3">
                <Crown
                  size={20}
                  className="text-yellow-400"
                />

                <div>
                  <p className="text-sm font-bold">
                    Patente máxima
                  </p>

                  <p className="mt-1 text-xs text-white/30">
                    Você alcançou a maior patente disponível.
                  </p>
                </div>
              </div>
            </div>
          )}

          {proximaPatente && (
            <div className="mt-7 flex items-center gap-3 rounded-2xl border border-white/5 bg-white/[0.02] p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 text-white/30">
                <Medal size={18} />
              </div>

              <div>
                <p className="text-xs text-white/30">
                  Próxima patente
                </p>

                <p className="mt-1 text-sm font-bold">
                  {proximaPatente.nome}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* ESTATÍSTICAS */}
        <div className="rounded-[2rem] border border-white/[0.09] bg-white/[0.045] p-7 shadow-xl shadow-black/20 backdrop-blur-xl">
          <div className="mb-6">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/25">
              Desempenho
            </p>

            <h3 className="mt-2 text-xl font-black">
              Suas estatísticas
            </h3>
          </div>

          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <ProfileStat
              icon={<Gamepad2 size={19} />}
              value="0"
              label="Partidas"
            />

            <ProfileStat
              icon={<Trophy size={19} />}
              value="0"
              label="Vitórias"
            />

            <ProfileStat
              icon={<Target size={19} />}
              value="0%"
              label="Acerto"
            />

            <ProfileStat
              icon={<Medal size={19} />}
              value="-"
              label="Ranking"
            />
          </div>

          <p className="mt-5 text-xs text-white/20">
            Essas estatísticas serão preenchidas conforme o sistema
            de partidas e ranking forem registrados no banco de dados.
          </p>
        </div>
      </div>

      {/* HISTÓRICO */}
      <div className="mt-6 rounded-[2rem] border border-white/[0.09] bg-white/[0.045] shadow-xl shadow-black/20 backdrop-blur-xl">
        <div className="flex items-center justify-between border-b border-white/5 p-6">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/25">
              Histórico
            </p>

            <h3 className="mt-2 text-xl font-black">
              Partidas recentes
            </h3>
          </div>

          <button
            type="button"
            className="cursor-pointer text-xs font-bold text-fuchsia-200 transition hover:text-fuchsia-100"
          >
            Ver tudo
          </button>
        </div>

        <div className="p-8 text-center">
          <Gamepad2
            size={28}
            className="mx-auto text-white/10"
          />

          <p className="mt-3 text-sm font-bold text-white/30">
            Nenhuma partida registrada
          </p>

          <p className="mt-1 text-xs text-white/15">
            Seu histórico aparecerá aqui depois das partidas.
          </p>
        </div>
      </div>

      {/* CONQUISTAS */}
      <div className="mt-6">
        <div className="mb-5">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/25">
            Conquistas
          </p>

          <h3 className="mt-2 text-xl font-black">
            Suas conquistas
          </h3>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Achievement
            icon={<Trophy size={21} />}
            title="Primeira vitória"
            description="Vença sua primeira partida"
          />

          <Achievement
            icon={<Crown size={21} />}
            title="Campeão"
            description="Termine uma partida em 1º lugar"
          />

          <Achievement
            icon={<Target size={21} />}
            title="Precisão"
            description="Acumule 90% de acerto"
          />

          <Achievement
            icon={<Medal size={21} />}
            title="Veterano"
            description="Jogue 50 partidas"
          />
        </div>
      </div>
    </section>

    {/* MODAL DE EDIÇÃO */}
    {editando && (
      <div
        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 p-4 backdrop-blur-md"
        onMouseDown={(event) => {
          if (
            event.target === event.currentTarget &&
            !salvando
          ) {
            fecharEdicao();
          }
        }}
      >
        <div className="w-full max-w-md overflow-hidden rounded-[2rem] border border-white/10 bg-[#10101d] shadow-2xl shadow-black/60">
          {/* CABEÇALHO */}
          <div className="flex items-center justify-between border-b border-white/5 px-6 py-5">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-fuchsia-300">
                Configurações
              </p>

              <h2 className="mt-1 text-xl font-black">
                Editar perfil
              </h2>
            </div>

            <button
              type="button"
              onClick={fecharEdicao}
              disabled={salvando}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] text-white/40 transition hover:bg-white/[0.07] hover:text-white disabled:opacity-40"
            >
              <X size={17} />
            </button>
          </div>

          {/* FORMULÁRIO */}
          <div className="space-y-5 p-6">
            {/* ERRO */}
            {erroEdicao && (
              <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-xs font-medium text-red-300">
                {erroEdicao}
              </div>
            )}

            {/* SUCESSO */}
            {sucessoEdicao && (
              <div className="flex items-start gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-xs font-medium text-emerald-300">
                <CircleCheck
                  size={16}
                  className="mt-0.5 shrink-0"
                />

                <span>
                  {sucessoEdicao}
                </span>
              </div>
            )}

            {/* NOME */}
            <div>
              <label className="mb-2 block text-xs font-bold text-white/40">
                Nome
              </label>

              <div className="relative">
                <User
                  size={16}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20"
                />

                <input
                  type="text"
                  value={dadosEdicao.nome}
                  onChange={(event) =>
                    setDadosEdicao((atual) => ({
                      ...atual,
                      nome: event.target.value,
                    }))
                  }
                  disabled={salvando}
                  className="h-12 w-full rounded-xl border border-white/10 bg-white/[0.03] pl-11 pr-4 text-sm text-white outline-none transition placeholder:text-white/20 focus:border-fuchsia-400/40 focus:bg-white/[0.05] disabled:opacity-50"
                  placeholder="Seu nome"
                />
              </div>
            </div>

            {/* EMAIL */}
            <div>
              <label className="mb-2 block text-xs font-bold text-white/40">
                E-mail
              </label>

              <div className="relative">
                <Mail
                  size={16}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20"
                />

                <input
                  type="email"
                  value={dadosEdicao.email}
                  onChange={(event) =>
                    setDadosEdicao((atual) => ({
                      ...atual,
                      email: event.target.value,
                    }))
                  }
                  disabled={salvando}
                  className="h-12 w-full rounded-xl border border-white/10 bg-white/[0.03] pl-11 pr-4 text-sm text-white outline-none transition placeholder:text-white/20 focus:border-fuchsia-400/40 focus:bg-white/[0.05] disabled:opacity-50"
                  placeholder="seu@email.com"
                />
              </div>

              <p className="mt-2 text-[11px] text-white/20">
                Se você alterar o e-mail, ele ficará como não verificado.
              </p>
            </div>

            {/* SENHA */}
            <div>
              <label className="mb-2 block text-xs font-bold text-white/40">
                Nova senha
                <span className="ml-2 font-normal text-white/20">
                  opcional
                </span>
              </label>

              <div className="relative">
                <Lock
                  size={16}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20"
                />

                <input
                  type="password"
                  value={dadosEdicao.senha}
                  onChange={(event) =>
                    setDadosEdicao((atual) => ({
                      ...atual,
                      senha: event.target.value,
                    }))
                  }
                  disabled={salvando}
                  className="h-12 w-full rounded-xl border border-white/10 bg-white/[0.03] pl-11 pr-4 text-sm text-white outline-none transition placeholder:text-white/20 focus:border-fuchsia-400/40 focus:bg-white/[0.05] disabled:opacity-50"
                  placeholder="Digite apenas se quiser alterar"
                />
              </div>

              <p className="mt-2 text-[11px] text-white/20">
                Deixe vazio para manter sua senha atual.
              </p>
            </div>
          </div>

          {/* RODAPÉ */}
          <div className="flex gap-3 border-t border-white/5 bg-white/[0.015] p-6">
            <button
              type="button"
              onClick={fecharEdicao}
              disabled={salvando}
              className="h-11 flex-1 rounded-xl border border-white/10 bg-white/[0.03] text-xs font-bold text-white/50 transition hover:bg-white/[0.07] hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
            >
              Cancelar
            </button>

            <button
              type="button"
              onClick={salvarEdicao}
              disabled={salvando}
              className="flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-fuchsia-500 to-violet-600 text-xs font-black text-white shadow-lg shadow-fuchsia-900/20 transition hover:-translate-y-0.5 hover:from-fuchsia-400 hover:to-violet-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Save size={15} />

              {salvando
                ? "Salvando..."
                : "Salvar alterações"}
            </button>
          </div>
        </div>
      </div>
    )}
  </main>

  );
}

/* ESTATÍSTICA */

function ProfileStat({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode;
  value: string;
  label: string;
}) {
  return (<div className="rounded-2xl border border-white/10 bg-white/[0.035] p-5 transition hover:-translate-y-0.5 hover:border-fuchsia-300/20 hover:bg-white/[0.05]"> <div className="mb-4 flex h-9 w-9 items-center justify-center rounded-lg bg-fuchsia-500/10 text-fuchsia-200 ring-1 ring-fuchsia-300/15">
    {icon} </div>

    <p className="text-2xl font-black">
      {value}
    </p>

    <p className="mt-1 text-xs text-white/25">
      {label}
    </p>
  </div>

  );
}

/* CONQUISTA */

function Achievement({
  icon,
  title,
  description,
  unlocked = false,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  unlocked?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border p-5 transition hover:-translate-y-0.5 ${unlocked
        ? "border-fuchsia-300/20 bg-fuchsia-500/[0.07]"
        : "border-white/5 bg-white/[0.02] opacity-40"
        }`}
    >
      <div
        className={`flex h-11 w-11 items-center justify-center rounded-xl ${unlocked
          ? "bg-fuchsia-500/10 text-fuchsia-200"
          : "bg-white/5 text-white/30"
          }`}
      >
        {icon} </div>


      <h4 className="mt-4 text-sm font-bold">
        {title}
      </h4>

      <p className="mt-2 text-xs leading-5 text-white/25">
        {description}
      </p>

      {unlocked && (
        <p className="mt-3 text-[10px] font-bold uppercase tracking-wider text-fuchsia-200">
          Desbloqueada
        </p>
      )}
    </div>

  );
}
