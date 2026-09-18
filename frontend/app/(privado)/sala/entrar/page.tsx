"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { io, Socket } from "socket.io-client";
import Cookies from "js-cookie";

interface Usuario {
  id: number;
  nome: string;
  pontuacao: number | null;
}

interface Jogador {
  id: number;
  usuarioId: number;
  salaId: number;
  eliminado: boolean;
  usuario: Usuario;
}

interface Criador {
  id: number;
  nome: string;
}

interface Sala {
  id: number;
  nome: string;
  codigo: string;
  status: string;
  maxJogadores: number;
  criador: Criador | null;
  jogadores: Jogador[];
}

export default function EntrarSalaPage() {
  const searchParams = useSearchParams();

  const codigo = searchParams.get("codigo");

  const [sala, setSala] = useState<Sala | null>(null);
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    if (!codigo) {
      setErro("Código da sala não informado.");
      setCarregando(false);
      return;
    }

    const token = Cookies.get("token");

    if (!token) {
      setErro("Você precisa estar logado.");
      setCarregando(false);
      return;
    }

    const API = process.env.NEXT_PUBLIC_API;

    if (!API) {
      setErro("API não configurada.");
      setCarregando(false);
      return;
    }

    const socket: Socket = io(API, {
      auth: {
        token,
      },
    });

    socket.on("connect", () => {
      console.log("Socket conectado:", socket.id);

      socket.emit("entrar_sala", {
        codigo: codigo.toUpperCase(),
      });
    });

    socket.on("sala_atualizada", (data: Sala) => {
      console.log("Sala recebida:", data);

      setSala(data);
      setCarregando(false);
      setErro("");
    });

    socket.on("erro_sala", (data: { mensagem: string }) => {
      setErro(data.mensagem);
      setCarregando(false);
    });

    socket.on("connect_error", (error) => {
      console.error("Erro ao conectar Socket.IO:", error);

      setErro("Não foi possível conectar ao servidor.");
      setCarregando(false);
    });

    return () => {
      socket.disconnect();
    };
  }, [codigo]);

  if (carregando) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#080812] text-white">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-purple-500 border-t-transparent" />

          <p className="mt-4 text-sm text-white/40">
            Entrando na sala...
          </p>
        </div>
      </main>
    );
  }

  if (erro) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#080812] px-5 text-white">
        <div className="w-full max-w-md rounded-3xl border border-white/10 bg-white/[0.03] p-8 text-center">
          <h1 className="text-xl font-black">
            Erro
          </h1>

          <p className="mt-3 text-sm text-red-300">
            {erro}
          </p>
        </div>
      </main>
    );
  }

  if (!sala) {
    return null;
  }

  return (
    <main className="min-h-screen bg-[#080812] px-5 py-10 text-white">
      <div className="mx-auto max-w-4xl">

        {/* Cabeçalho */}

        <div className="mb-8 text-center">

          <p className="text-xs font-bold uppercase tracking-[0.25em] text-purple-400">
            Lobby
          </p>

          <h1 className="mt-3 text-4xl font-black">
            {sala.nome}
          </h1>

          <div className="mt-4 inline-flex rounded-xl border border-purple-400/20 bg-purple-500/10 px-5 py-2">
            <span className="text-sm font-black tracking-[0.25em] text-purple-300">
              {sala.codigo}
            </span>
          </div>

          <p className="mt-4 text-sm text-white/40">
            Aguardando o início da partida...
          </p>

        </div>

        {/* Conteúdo */}

        <div className="grid gap-5 md:grid-cols-[1fr_280px]">

          {/* Jogadores */}

          <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">

            <div className="mb-6 flex items-center justify-between">

              <div>
                <h2 className="text-lg font-black">
                  Jogadores
                </h2>

                <p className="mt-1 text-xs text-white/35">
                  Pessoas na sala
                </p>
              </div>

              <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-2">
                <span className="font-black text-purple-300">
                  {sala.jogadores.length}
                </span>

                <span className="text-white/30">
                  {" / "}
                  {sala.maxJogadores}
                </span>
              </div>

            </div>

            <div className="space-y-2">

              {sala.jogadores.map((jogador) => (
                <div
                  key={jogador.id}
                  className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3"
                >

                  <div className="flex items-center gap-3">

                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/10 font-black text-purple-300">
                      {jogador.usuario.nome
                        .charAt(0)
                        .toUpperCase()}
                    </div>

                    <div>
                      <p className="text-sm font-bold">
                        {jogador.usuario.nome}
                      </p>

                      {sala.criador?.id === jogador.usuario.id && (
                        <p className="text-[10px] font-bold uppercase tracking-wider text-purple-400">
                          Criador
                        </p>
                      )}
                    </div>

                  </div>

                </div>
              ))}

            </div>

          </section>

          {/* Informações */}

          <aside className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">

            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/30">
              Informações
            </p>

            <div className="mt-5 space-y-4">

              <div>
                <p className="text-xs text-white/30">
                  Criador
                </p>

                <p className="mt-1 font-bold">
                  {sala.criador?.nome ?? "Não informado"}
                </p>
              </div>

              <div>
                <p className="text-xs text-white/30">
                  Jogadores
                </p>

                <p className="mt-1 font-bold">
                  {sala.jogadores.length} / {sala.maxJogadores}
                </p>
              </div>

              <div>
                <p className="text-xs text-white/30">
                  Status
                </p>

                <p className="mt-1 font-bold capitalize text-green-400">
                  {sala.status}
                </p>
              </div>

            </div>

          </aside>

        </div>

      </div>
    </main>
  );
}