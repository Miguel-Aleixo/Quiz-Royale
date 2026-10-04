import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';

import {
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';

import { Server, Socket } from 'socket.io';
import * as jwt from 'jsonwebtoken';

import { PrismaService } from '../prisma/prisma.service';
import { UsuarioService } from '../usuario/usuario.service';

interface RodadaState {
  rodadaAtual: number;

  timer: NodeJS.Timeout | null;

  encerrando: boolean;

  finalizando: boolean;

  totalJogadoresRodada: number;

  jogadoresQueResponderam: Set<number>;

  iniciadaEm: number;

  terminaEm: number;
}

interface PerguntaSocket {
  rodada: any;
  numeroRodada: number;
  totalRodadas: number;

  iniciadaEm: number;
  terminaEm: number;
}

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class PartidaGateway {
  @WebSocketServer()
  server!: Server;

  constructor(
    private readonly prisma: PrismaService,
    private readonly usuarioService: UsuarioService,
  ) { }

  /*
   * =========================================================
   * CONTROLE DAS PARTIDAS
   * =========================================================
   */

  private partidas = new Map<string, RodadaState>();

  /*
   * =========================================================
   * AUTENTICAÇÃO
   * =========================================================
   */

  async handleConnection(socket: Socket) {
    try {
      const token = socket.handshake.auth?.token;

      if (!token) {
        socket.emit('erro_partida', {
          mensagem: 'Token não informado.',
        });

        socket.disconnect();

        return;
      }

      const tokenLimpo = token.replace('Bearer ', '');

      const secret = process.env.JWT_SECRET;

      if (!secret) {
        throw new UnauthorizedException(
          'JWT_SECRET não configurado.',
        );
      }

      const decoded = jwt.verify(
        tokenLimpo,
        secret,
      );

      if (
        typeof decoded === 'string' ||
        !decoded.sub
      ) {
        throw new UnauthorizedException(
          'Token inválido.',
        );
      }

      const usuarioId = Number(decoded.sub);

      if (!usuarioId) {
        throw new UnauthorizedException(
          'Usuário inválido.',
        );
      }

      /*
       * =====================================================
       * BUSCAR USUÁRIO
       * =====================================================
       */

      const usuario =
        await this.prisma.usuario.findUnique({
          where: {
            id: usuarioId,
          },

          select: {
            id: true,
            emailVerificado: true,
          },
        });

      if (!usuario) {
        socket.emit('erro_partida', {
          mensagem: 'Usuário não encontrado.',
        });

        socket.disconnect();

        return;
      }

      /*
       * =====================================================
       * E-MAIL NÃO VERIFICADO
       * =====================================================
       */

      if (!usuario.emailVerificado) {
        socket.emit('erro_partida', {
          mensagem:
            'Você precisa verificar seu e-mail para jogar.',
        });

        socket.disconnect();

        return;
      }

      /*
       * =====================================================
       * SOCKET AUTORIZADO
       * =====================================================
       */

      socket.data.usuarioId = usuario.id;

      socket.data.emailVerificado =
        usuario.emailVerificado;

      console.log(
        `Socket autenticado - Usuario: ${usuario.id}`,
      );
    } catch (error) {
      console.error(
        'Erro na autenticação do Socket:',
        error,
      );

      socket.emit('erro_partida', {
        mensagem: 'Sessão inválida ou expirada.',
      });

      socket.disconnect();
    }
  }

  /*
   * =========================================================
   * ENTRAR NA PARTIDA
   * =========================================================
   */

  @SubscribeMessage('entrar_partida')
  async entrarPartida(
    @MessageBody()
    data: {
      codigo: string;
    },

    @ConnectedSocket()
    socket: Socket,
  ) {
    try {
      const usuarioId =
        socket.data.usuarioId;

      if (!usuarioId) {
        throw new UnauthorizedException(
          'Usuário não autenticado.',
        );
      }

      if (!data?.codigo) {
        throw new BadRequestException(
          'Código da sala não informado.',
        );
      }

      const codigo =
        data.codigo.toUpperCase();

      const sala =
        await this.prisma.sala.findUnique({
          where: {
            codigo,
          },

          include: {
            jogadores: true,

            rodadas: {
              orderBy: {
                ordem: 'asc',
              },

              include: {
                pergunta: {
                  select: {
                    id: true,
                    enunciado: true,

                    alternativas: {
                      select: {
                        id: true,
                        texto: true,
                      },
                    },
                  },
                },
              },
            },
          },
        });

      if (!sala) {
        throw new BadRequestException(
          'Sala não encontrada.',
        );
      }

      if (sala.status !== 'ANDAMENTO') {
        throw new BadRequestException(
          'A partida ainda não foi iniciada.',
        );
      }

      if (sala.rodadas.length === 0) {
        throw new BadRequestException(
          'Essa partida não possui rodadas.',
        );
      }

      const jogador =
        await this.prisma.jogador.findFirst({
          where: {
            usuarioId,
            salaId: sala.id,
          },
        });

      if (!jogador) {
        throw new BadRequestException(
          'Você não está participando dessa sala.',
        );
      }

      socket.join(
        `partida:${codigo}`,
      );

      /*
       * Jogador eliminado pode reconectar,
       * mas não recebe novas perguntas.
       */

      if (jogador.eliminado) {
        const classificacao =
          await this.obterClassificacaoAtual(
            jogador.id,
            sala.id,
          );

        socket.emit(
          'jogador_eliminado',
          {
            mensagem:
              'Você foi eliminado e não participa mais das rodadas.',

            jogadorId:
              jogador.id,

            usuarioId,

            posicaoAtual:
              classificacao.posicao,

            acertos:
              classificacao.acertos,

            tempoTotal:
              classificacao.tempoTotal,

            totalRespostas:
              classificacao.totalRespostas,

            totalJogadores:
              classificacao.totalJogadores,
          },
        );

        return;
      }

      /*
       * =====================================================
       * ESTADO DA PARTIDA
       * =====================================================
       */

      let estado =
        this.partidas.get(codigo);

      /*
       * Primeira conexão da partida.
       */

      if (!estado) {
        estado = {
          rodadaAtual: 0,

          timer: null,

          encerrando: false,

          finalizando: false,

          totalJogadoresRodada: 0,

          jogadoresQueResponderam:
            new Set<number>(),

          iniciadaEm: 0,

          terminaEm: 0,
        };

        this.partidas.set(
          codigo,
          estado,
        );

        await this.iniciarRodada(
          codigo,
          sala.rodadas,
        );

        return;
      }

      /*
       * Se a partida estiver sendo finalizada,
       * não envia uma nova pergunta.
       */

      if (estado.finalizando) {
        return;
      }

      /*
       * =====================================================
       * ENTRADA DURANTE A RODADA
       * =====================================================
       */

      const rodadaAtual =
        sala.rodadas[
        estado.rodadaAtual
        ];

      if (!rodadaAtual) {
        throw new BadRequestException(
          'Rodada atual não encontrada.',
        );
      }

      /*
       * O jogador recebe exatamente o mesmo
       * instante de término usado pelo servidor.
       */

      const agora = Date.now();

      if (
        estado.terminaEm > 0 &&
        agora >= estado.terminaEm
      ) {
        await this.encerrarRodada(
          codigo,
        );

        return;
      }

      socket.emit(
        'pergunta',
        {
          rodada:
            rodadaAtual,

          numeroRodada:
            estado.rodadaAtual + 1,

          totalRodadas:
            sala.rodadas.length,

          iniciadaEm:
            estado.iniciadaEm,

          terminaEm:
            estado.terminaEm,
        } satisfies PerguntaSocket,
      );

      socket.emit(
        'progresso_respostas',
        {
          respondidos:
            estado.jogadoresQueResponderam
              .size,

          total:
            estado.totalJogadoresRodada,
        },
      );

      console.log(
        `Jogador ${jogador.id} entrou na partida ${codigo} na rodada ${estado.rodadaAtual + 1
        }. Tempo restante: ${Math.max(
          0,
          estado.terminaEm -
          Date.now(),
        )
        }ms`,
      );
    } catch (error) {
      socket.emit(
        'erro_partida',
        {
          mensagem:
            error instanceof Error
              ? error.message
              : 'Erro ao entrar na partida.',
        },
      );
    }
  }

  /*
   * =========================================================
   * INICIAR RODADA
   * =========================================================
   */

  private async iniciarRodada(
    codigo: string,
    rodadas: any[],
  ) {
    const estado =
      this.partidas.get(codigo);

    if (!estado) {
      return;
    }

    if (estado.finalizando) {
      return;
    }

    const rodada =
      rodadas[
      estado.rodadaAtual
      ];

    if (!rodada) {
      await this.finalizarPartida(
        codigo,
        await this.obterSalaId(codigo),
      );

      return;
    }

    /*
     * Limpar timer anterior.
     */

    if (estado.timer) {
      clearTimeout(
        estado.timer,
      );

      estado.timer = null;
    }

    estado.encerrando = false;

    /*
     * Buscar sala.
     */

    const sala =
      await this.prisma.sala.findUnique({
        where: {
          codigo,
        },
      });

    if (!sala) {
      this.partidas.delete(
        codigo,
      );

      return;
    }

    /*
     * Buscar jogadores ativos.
     */

    const jogadoresAtivos =
      await this.prisma.jogador.findMany({
        where: {
          salaId: sala.id,
          eliminado: false,
        },

        select: {
          usuarioId: true,
        },
      });

    const usuariosAtivos =
      new Set(
        jogadoresAtivos.map(
          (jogador) =>
            jogador.usuarioId,
        ),
      );

    /*
     * Não existem jogadores ativos.
     */

    if (
      usuariosAtivos.size === 0
    ) {
      await this.finalizarPartida(
        codigo,
        sala.id,
      );

      return;
    }

    /*
     * =====================================================
     * CONTADOR DA RODADA
     * =====================================================
     */

    estado.totalJogadoresRodada =
      jogadoresAtivos.length;

    estado.jogadoresQueResponderam =
      new Set<number>();

    /*
     * =====================================================
     * RELÓGIO DO SERVIDOR
     * =====================================================
     *
     * O servidor define exatamente quando
     * a rodada começa e termina.
     */

    estado.iniciadaEm =
      Date.now();

    estado.terminaEm =
      estado.iniciadaEm +
      rodada.tempoLimite * 1000;

    /*
     * Buscar sockets conectados.
     */

    const sockets =
      await this.server
        .in(
          `partida:${codigo}`,
        )
        .fetchSockets();

    /*
     * Enviar pergunta somente
     * para jogadores ativos.
     */

    for (
      const socket of sockets
    ) {
      const usuarioId =
        Number(
          socket.data.usuarioId,
        );

      if (
        usuariosAtivos.has(
          usuarioId,
        )
      ) {
        socket.emit('pergunta', {
          rodada,
          numeroRodada: estado.rodadaAtual + 1,
          totalRodadas: rodadas.length,
          iniciadaEm: estado.iniciadaEm,
          terminaEm: estado.terminaEm,
          agoraServidor: Date.now(),
        });
      }
    }

    /*
     * Progresso inicial.
     */

    this.server
      .to(`partida:${codigo}`)
      .emit(
        'progresso_respostas',
        {
          respondidos: 0,

          total:
            estado.totalJogadoresRodada,
        },
      );

    console.log(
      `Partida ${codigo} iniciou a rodada ${estado.rodadaAtual + 1
      }.`,
    );

    console.log(
      `Início: ${estado.iniciadaEm}`,
    );

    console.log(
      `Fim: ${estado.terminaEm}`,
    );

    /*
     * =====================================================
     * TIMER DO SERVIDOR
     * =====================================================
     */

    const tempoAteFim =
      Math.max(
        0,
        estado.terminaEm -
        Date.now(),
      );

    estado.timer =
      setTimeout(
        async () => {
          try {
            await this.encerrarRodada(
              codigo,
            );
          } catch (error) {
            console.error(
              'Erro ao encerrar rodada pelo timer:',
              error,
            );
          }
        },
        tempoAteFim,
      );
  }

  /*
   * =========================================================
   * RESPONDER PERGUNTA
   * =========================================================
   */

  @SubscribeMessage('responder')
  async responder(
    @MessageBody()
    data: {
      codigo: string;
      alternativaId: number;
      rodadaId: number;
      tempoResposta: number;
    },

    @ConnectedSocket()
    socket: Socket,
  ) {
    try {
      const usuarioId =
        socket.data.usuarioId;

      if (!usuarioId) {
        throw new UnauthorizedException(
          'Usuário não autenticado.',
        );
      }

      if (!data?.codigo) {
        throw new BadRequestException(
          'Código da sala não informado.',
        );
      }

      if (!data.alternativaId) {
        throw new BadRequestException(
          'Alternativa não informada.',
        );
      }

      if (!data.rodadaId) {
        throw new BadRequestException(
          'Rodada não informada.',
        );
      }

      const codigo =
        data.codigo.toUpperCase();

      /*
       * =====================================================
       * ESTADO
       * =====================================================
       */

      const estado =
        this.partidas.get(codigo);

      if (!estado) {
        throw new BadRequestException(
          'A partida não está em andamento.',
        );
      }

      if (
        estado.encerrando ||
        estado.finalizando
      ) {
        return;
      }

      /*
       * =====================================================
       * VALIDAR PRAZO NO SERVIDOR
       * =====================================================
       */

      const agora =
        Date.now();

      if (
        estado.terminaEm <= 0 ||
        agora >= estado.terminaEm
      ) {
        await this.encerrarRodada(
          codigo,
        );

        return;
      }

      /*
       * O servidor é a fonte oficial
       * do tempo de resposta.
       */

      const tempoRespostaServidor =
        Math.max(
          0,
          Math.min(
            agora -
            estado.iniciadaEm,
            estado.terminaEm -
            estado.iniciadaEm,
          ),
        );

      /*
       * =====================================================
       * BUSCAR SALA
       * =====================================================
       */

      const sala =
        await this.prisma.sala.findUnique({
          where: {
            codigo,
          },
        });

      if (!sala) {
        throw new BadRequestException(
          'Sala não encontrada.',
        );
      }

      /*
       * =====================================================
       * BUSCAR JOGADOR
       * =====================================================
       */

      const jogador =
        await this.prisma.jogador.findFirst({
          where: {
            usuarioId,
            salaId: sala.id,
          },
        });

      if (!jogador) {
        throw new BadRequestException(
          'Você não está participando dessa sala.',
        );
      }

      /*
       * Jogador eliminado não pode responder.
       */

      if (jogador.eliminado) {
        socket.emit(
          'jogador_eliminado',
          {
            mensagem:
              'Você foi eliminado e não pode mais responder.',
          },
        );

        return;
      }

      /*
       * =====================================================
       * BUSCAR RODADA
       * =====================================================
       */

      const rodada =
        await this.prisma.rodada.findUnique({
          where: {
            id: data.rodadaId,
          },
        });

      if (!rodada) {
        throw new BadRequestException(
          'Rodada não encontrada.',
        );
      }

      /*
       * Verificar sala.
       */

      if (
        rodada.salaId !==
        sala.id
      ) {
        throw new BadRequestException(
          'Essa rodada não pertence a essa sala.',
        );
      }

      /*
       * =====================================================
       * VERIFICAR RODADA ATUAL
       * =====================================================
       */

      const rodadaAtual =
        await this.prisma.rodada.findFirst({
          where: {
            salaId: sala.id,
          },

          orderBy: {
            ordem: 'asc',
          },

          skip:
            estado.rodadaAtual,
        });

      if (
        !rodadaAtual ||
        rodadaAtual.id !==
        rodada.id
      ) {
        throw new BadRequestException(
          'Essa não é a rodada atual.',
        );
      }

      /*
       * =====================================================
       * ALTERNATIVA
       * =====================================================
       */

      const alternativa =
        await this.prisma.alternativa.findUnique({
          where: {
            id: data.alternativaId,
          },
        });

      if (!alternativa) {
        throw new BadRequestException(
          'Alternativa não encontrada.',
        );
      }

      if (
        alternativa.perguntaId !==
        rodada.perguntaId
      ) {
        throw new BadRequestException(
          'Essa alternativa não pertence à pergunta atual.',
        );
      }

      /*
       * =====================================================
       * IMPEDIR RESPOSTA DUPLICADA
       * =====================================================
       */

      const respostaExistente =
        await this.prisma.resposta.findFirst({
          where: {
            jogadorId:
              jogador.id,

            alternativa: {
              perguntaId:
                rodada.perguntaId,
            },
          },
        });

      if (respostaExistente) {
        throw new BadRequestException(
          'Você já respondeu essa pergunta.',
        );
      }

      /*
       * =====================================================
       * REGISTRAR RESPOSTA
       * =====================================================
       *
       * IMPORTANTE:
       *
       * O tempo enviado pelo frontend NÃO é usado.
       * O servidor calcula o tempo.
       */

      const resposta =
        await this.prisma.resposta.create({
          data: {
            jogadorId:
              jogador.id,

            alternativaId:
              data.alternativaId,

            tempoResposta:
              Math.round(
                tempoRespostaServidor,
              ),
          },

          include: {
            alternativa: {
              select: {
                id: true,
                correta: true,
              },
            },
          },
        });

      const correta =
        resposta.alternativa.correta;

      /*
       * =====================================================
       * ELIMINAÇÃO POR ERRO
       * =====================================================
       */

      if (!correta) {
        await this.prisma.jogador.update({
          where: {
            id: jogador.id,
          },

          data: {
            eliminado: true,
          },
        });

        const classificacao =
          await this.obterClassificacaoAtual(
            jogador.id,
            sala.id,
          );

        socket.emit(
          'jogador_eliminado',
          {
            mensagem:
              'Você errou a pergunta e foi eliminado!',

            jogadorId:
              jogador.id,

            usuarioId,

            posicaoAtual:
              classificacao.posicao,

            acertos:
              classificacao.acertos,

            tempoTotal:
              classificacao.tempoTotal,

            totalRespostas:
              classificacao.totalRespostas,

            totalJogadores:
              classificacao.totalJogadores,
          },
        );

        console.log(
          `Jogador ${jogador.id} foi eliminado na rodada ${rodada.id}.`,
        );
      } else {
        console.log(
          `Jogador ${jogador.id} acertou a rodada ${rodada.id}.`,
        );
      }

      /*
       * =====================================================
       * ESTATÍSTICAS
       * =====================================================
       */

      const estatisticas =
        await this.obterEstatisticasJogador(
          jogador.id,
        );

      socket.emit(
        'resultado_resposta',
        {
          correta,

          alternativaId:
            data.alternativaId,

          rodadaId:
            data.rodadaId,

          acertos:
            estatisticas.acertos,

          tempoTotal:
            estatisticas.tempoTotal,

          eliminado:
            !correta,
        },
      );

      /*
       * =====================================================
       * NÃO EXISTE MAIS REGRA DE 10 ACERTOS
       * =====================================================
       *
       * A partida somente termina:
       *
       * - quando todos os jogadores ativos
       *   forem eliminados;
       *
       * - quando terminar a última rodada.
       */

      await this.verificarFimRodada(
        codigo,
        sala.id,
        rodada.id,
      );
    } catch (error) {
      socket.emit(
        'erro_resposta',
        {
          mensagem:
            error instanceof Error
              ? error.message
              : 'Erro ao registrar resposta.',
        },
      );
    }
  }

  /*
   * =========================================================
   * CLASSIFICAÇÃO ATUAL
   * =========================================================
   */

  private async obterClassificacaoAtual(
    jogadorId: number,
    salaId: number,
  ) {
    const jogadores =
      await this.prisma.jogador.findMany({
        where: {
          salaId,
        },

        include: {
          respostas: {
            include: {
              alternativa: {
                select: {
                  correta: true,
                },
              },
            },
          },
        },
      });

    const jogadoresComEstatisticas =
      jogadores.map(
        (jogador) => {
          const acertos =
            jogador.respostas.filter(
              (resposta) =>
                resposta.alternativa.correta,
            ).length;

          const tempoTotal =
            jogador.respostas.reduce(
              (
                total,
                resposta,
              ) =>
                total +
                resposta.tempoResposta,
              0,
            );

          return {
            jogadorId:
              jogador.id,

            acertos,

            tempoTotal,

            totalRespostas:
              jogador.respostas.length,
          };
        },
      );

    jogadoresComEstatisticas.sort(
      (a, b) => {
        if (
          a.acertos !==
          b.acertos
        ) {
          return (
            b.acertos -
            a.acertos
          );
        }

        if (
          a.tempoTotal !==
          b.tempoTotal
        ) {
          return (
            a.tempoTotal -
            b.tempoTotal
          );
        }

        return (
          a.jogadorId -
          b.jogadorId
        );
      },
    );

    const indice =
      jogadoresComEstatisticas.findIndex(
        (item) =>
          item.jogadorId ===
          jogadorId,
      );

    const jogador =
      jogadoresComEstatisticas[
      indice
      ];

    return {
      posicao:
        indice >= 0
          ? indice + 1
          : jogadoresComEstatisticas.length,

      acertos:
        jogador?.acertos ?? 0,

      tempoTotal:
        jogador?.tempoTotal ?? 0,

      totalRespostas:
        jogador?.totalRespostas ?? 0,

      totalJogadores:
        jogadoresComEstatisticas.length,
    };
  }

  /*
   * =========================================================
   * ESTATÍSTICAS
   * =========================================================
   */

  private async obterEstatisticasJogador(
    jogadorId: number,
  ) {
    const respostas =
      await this.prisma.resposta.findMany({
        where: {
          jogadorId,
        },

        include: {
          alternativa: {
            select: {
              correta: true,
            },
          },
        },
      });

    const acertos =
      respostas.filter(
        (resposta) =>
          resposta.alternativa.correta,
      ).length;

    const tempoTotal =
      respostas.reduce(
        (
          total,
          resposta,
        ) =>
          total +
          resposta.tempoResposta,
        0,
      );

    return {
      acertos,
      tempoTotal,
    };
  }

  /*
   * =========================================================
   * VERIFICAR FIM DA RODADA
   * =========================================================
   */

  private async verificarFimRodada(
    codigo: string,
    salaId: number,
    rodadaId: number,
  ) {
    const estado =
      this.partidas.get(codigo);

    if (!estado) {
      return;
    }

    if (
      estado.encerrando ||
      estado.finalizando
    ) {
      return;
    }

    /*
     * Somente jogadores ativos contam.
     */

    const jogadores =
      await this.prisma.jogador.findMany({
        where: {
          salaId,

          eliminado: false,
        },

        select: {
          id: true,
        },
      });

    /*
     * Ninguém ativo.
     */

    if (
      jogadores.length === 0
    ) {
      await this.finalizarPartida(
        codigo,
        salaId,
      );

      return;
    }

    /*
     * Buscar respostas da rodada.
     */

    const respostas =
      await this.prisma.resposta.findMany({
        where: {
          jogadorId: {
            in: jogadores.map(
              (jogador) =>
                jogador.id,
            ),
          },

          alternativa: {
            pergunta: {
              rodadas: {
                some: {
                  id: rodadaId,
                },
              },
            },
          },
        },

        select: {
          jogadorId: true,
        },
      });

    const jogadoresQueResponderam =
      new Set(
        respostas.map(
          (resposta) =>
            resposta.jogadorId,
        ),
      );

    /*
     * Atualizar estado em memória.
     */

    estado.jogadoresQueResponderam =
      jogadoresQueResponderam;

    this.server
      .to(`partida:${codigo}`)
      .emit(
        'progresso_respostas',
        {
          respondidos:
            jogadoresQueResponderam.size,

          total:
            estado.totalJogadoresRodada,
        },
      );

    console.log(
      `Rodada ${rodadaId}: ${jogadoresQueResponderam.size}/${jogadores.length} jogadores ativos responderam.`,
    );

    /*
     * Todos responderam.
     */

    if (
      jogadoresQueResponderam.size >=
      jogadores.length
    ) {
      await this.encerrarRodada(
        codigo,
      );
    }
  }

  /*
   * =========================================================
   * CALCULAR PONTOS
   * =========================================================
   */

  private calcularPontosPosicao(
    posicao: number,
  ): number {
    const pontos: Record<
      number,
      number
    > = {
      1: 100,
      2: 75,
      3: 50,
      4: 35,
      5: 25,
      6: 20,
      7: 15,
      8: 10,
      9: 5,
    };

    return (
      pontos[posicao] ??
      2
    );
  }

  /*
   * =========================================================
   * FINALIZAR PARTIDA
   * =========================================================
   */

  private async finalizarPartida(
    codigo: string,
    salaId: number,
  ) {
    const estado =
      this.partidas.get(codigo);

    /*
     * Evitar duas finalizações simultâneas.
     */

    if (estado?.finalizando) {
      return;
    }

    if (estado) {
      estado.finalizando = true;

      if (estado.timer) {
        clearTimeout(
          estado.timer,
        );

        estado.timer = null;
      }
    }

    const sala =
      await this.prisma.sala.findUnique({
        where: {
          id: salaId,
        },

        select: {
          criadorId: true,
          status: true,
        },
      });

    if (!sala) {
      this.partidas.delete(
        codigo,
      );

      return;
    }

    /*
     * Se já foi finalizada,
     * não processar novamente.
     */

    if (
      sala.status ===
      'FINALIZADA'
    ) {
      this.partidas.delete(
        codigo,
      );

      return;
    }

    /*
     * Buscar jogadores.
     */

    const jogadores =
      await this.prisma.jogador.findMany({
        where: {
          salaId,
        },

        include: {
          usuario: {
            select: {
              id: true,
              nome: true,
              pontuacao: true,
            },
          },

          respostas: {
            include: {
              alternativa: {
                select: {
                  correta: true,
                },
              },
            },
          },
        },
      });

    /*
     * Estatísticas.
     */

    const jogadoresComEstatisticas =
      jogadores.map(
        (jogador) => {
          const acertos =
            jogador.respostas.filter(
              (resposta) =>
                resposta.alternativa.correta,
            ).length;

          const tempoTotal =
            jogador.respostas.reduce(
              (
                total,
                resposta,
              ) =>
                total +
                resposta.tempoResposta,
              0,
            );

          return {
            jogador,

            acertos,

            tempoTotal,
          };
        },
      );

    /*
     * =====================================================
     * RANKING
     * =====================================================
     *
     * 1. Mais acertos
     * 2. Menor tempo total
     * 3. Menor ID
     */

    jogadoresComEstatisticas.sort(
      (a, b) => {
        if (
          a.acertos !==
          b.acertos
        ) {
          return (
            b.acertos -
            a.acertos
          );
        }

        if (
          a.tempoTotal !==
          b.tempoTotal
        ) {
          return (
            a.tempoTotal -
            b.tempoTotal
          );
        }

        return (
          a.jogador.id -
          b.jogador.id
        );
      },
    );

    /*
     * =====================================================
     * ATRIBUIR POSIÇÕES
     * =====================================================
     */

    for (
      let index = 0;
      index <
      jogadoresComEstatisticas.length;
      index++
    ) {
      const item =
        jogadoresComEstatisticas[
        index
        ];

      const posicao =
        index + 1;

      await this.prisma.jogador.update({
        where: {
          id:
            item.jogador.id,
        },

        data: {
          posicaoFinal:
            posicao,
        },
      });

      item.jogador.posicaoFinal =
        posicao;
    }

    /*
     * =====================================================
     * DISTRIBUIR PONTOS
     * =====================================================
     */

    const ranking: any[] = [];

    for (
      let index = 0;
      index <
      jogadoresComEstatisticas.length;
      index++
    ) {
      const item =
        jogadoresComEstatisticas[
        index
        ];

      const jogador =
        item.jogador;

      const posicao =
        index + 1;

      /*
       * Criador participa do ranking,
       * mas não recebe pontos permanentes.
       */

      const pontosGanhos =
        sala.criadorId ===
          jogador.usuario.id
          ? 0
          : this.calcularPontosPosicao(
            posicao,
          );

      const usuarioAtualizado =
        await this.prisma.usuario.update({
          where: {
            id:
              jogador.usuario.id,
          },

          data: {
            pontuacao: {
              increment:
                pontosGanhos,
            },
          },

          select: {
            id: true,
            nome: true,
            pontuacao: true,
            patenteId: true,
          },
        });

      /*
       * Recalcular patente.
       */

      const novaPatente =
        await this.prisma.patente.findFirst({
          where: {
            pontos: {
              lte:
                usuarioAtualizado.pontuacao,
            },
          },

          orderBy: {
            pontos: 'desc',
          },
        });

      if (
        novaPatente &&
        novaPatente.id !==
        usuarioAtualizado.patenteId
      ) {
        await this.prisma.usuario.update({
          where: {
            id:
              usuarioAtualizado.id,
          },

          data: {
            patenteId:
              novaPatente.id,
          },
        });
      }

      ranking.push({
        posicao,

        jogadorId:
          jogador.id,

        usuarioId:
          jogador.usuario.id,

        nome:
          jogador.usuario.nome,

        acertos:
          item.acertos,

        tempoTotal:
          item.tempoTotal,

        totalRespostas:
          jogador.respostas.length,

        pontosGanhos,

        pontuacao:
          pontosGanhos,

        eliminado:
          jogador.eliminado,
      });
    }

    console.log(
      `Ranking final da partida ${codigo}:`,
      ranking,
    );

    /*
     * =====================================================
     * FINALIZAR SALA
     * =====================================================
     */

    await this.prisma.sala.update({
      where: {
        id: salaId,
      },

      data: {
        status:
          'FINALIZADA',
      },
    });

    /*
     * =====================================================
     * ENVIAR RESULTADO
     * =====================================================
     */

    this.server
      .to(`partida:${codigo}`)
      .emit(
        'partida_finalizada',
        {
          codigo,

          ranking,
        },
      );

    /*
     * Limpar memória.
     */

    this.partidas.delete(
      codigo,
    );
  }

  /*
   * =========================================================
   * ENCERRAR RODADA
   * =========================================================
   */

  private async encerrarRodada(
    codigo: string,
  ) {
    const estado =
      this.partidas.get(codigo);

    if (!estado) {
      return;
    }

    /*
     * Evitar duas execuções simultâneas.
     */

    if (
      estado.encerrando ||
      estado.finalizando
    ) {
      return;
    }

    estado.encerrando =
      true;

    /*
     * Limpar timer.
     */

    if (estado.timer) {
      clearTimeout(
        estado.timer,
      );

      estado.timer = null;
    }

    /*
     * Buscar sala.
     */

    const sala =
      await this.prisma.sala.findUnique({
        where: {
          codigo,
        },

        include: {
          rodadas: {
            orderBy: {
              ordem: 'asc',
            },

            include: {
              pergunta: {
                select: {
                  id: true,
                  enunciado: true,

                  alternativas: {
                    select: {
                      id: true,
                      texto: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

    if (!sala) {
      this.partidas.delete(
        codigo,
      );

      return;
    }

    const rodadas =
      sala.rodadas;

    if (
      rodadas.length === 0
    ) {
      this.partidas.delete(
        codigo,
      );

      return;
    }

    /*
     * =====================================================
     * JOGADORES ATIVOS
     * =====================================================
     */

    const jogadoresAtivos =
      await this.prisma.jogador.findMany({
        where: {
          salaId: sala.id,

          eliminado: false,
        },

        select: {
          id: true,

          usuarioId: true,
        },
      });

    /*
     * =====================================================
     * ELIMINAR QUEM NÃO RESPONDEU
     * =====================================================
     */

    const rodadaAtual =
      rodadas[
      estado.rodadaAtual
      ];

    if (
      rodadaAtual &&
      jogadoresAtivos.length > 0
    ) {
      const respostasDaRodada =
        await this.prisma.resposta.findMany({
          where: {
            jogadorId: {
              in:
                jogadoresAtivos.map(
                  (jogador) =>
                    jogador.id,
                ),
            },

            alternativa: {
              perguntaId:
                rodadaAtual.perguntaId,
            },
          },

          select: {
            jogadorId: true,
          },
        });

      const jogadoresQueResponderam =
        new Set(
          respostasDaRodada.map(
            (resposta) =>
              resposta.jogadorId,
          ),
        );

      const jogadoresSemResposta =
        jogadoresAtivos.filter(
          (jogador) =>
            !jogadoresQueResponderam.has(
              jogador.id,
            ),
        );

      if (
        jogadoresSemResposta.length >
        0
      ) {
        await this.prisma.jogador.updateMany({
          where: {
            id: {
              in:
                jogadoresSemResposta.map(
                  (jogador) =>
                    jogador.id,
                ),
            },
          },

          data: {
            eliminado: true,
          },
        });

        const sockets =
          await this.server
            .in(
              `partida:${codigo}`,
            )
            .fetchSockets();

        for (
          const jogador of jogadoresSemResposta
        ) {
          const classificacao =
            await this.obterClassificacaoAtual(
              jogador.id,
              sala.id,
            );

          for (
            const socket of sockets
          ) {
            if (
              Number(
                socket.data.usuarioId,
              ) ===
              Number(
                jogador.usuarioId,
              )
            ) {
              socket.emit(
                'jogador_eliminado',
                {
                  mensagem:
                    'Você não respondeu a pergunta dentro do tempo e foi eliminado!',

                  jogadorId:
                    jogador.id,

                  usuarioId:
                    jogador.usuarioId,

                  codigo,

                  posicaoAtual:
                    classificacao.posicao,

                  acertos:
                    classificacao.acertos,

                  tempoTotal:
                    classificacao.tempoTotal,

                  totalRespostas:
                    classificacao.totalRespostas,

                  totalJogadores:
                    classificacao.totalJogadores,
                },
              );
            }
          }

          console.log(
            `Jogador ${jogador.id} foi eliminado por não responder a rodada ${rodadaAtual.id}.`,
          );
        }
      }
    }

    /*
     * =====================================================
     * VERIFICAR JOGADORES RESTANTES
     * =====================================================
     */

    const jogadoresAtivosDepois =
      await this.prisma.jogador.findMany({
        where: {
          salaId:
            sala.id,

          eliminado:
            false,
        },

        select: {
          id: true,
        },
      });

    /*
     * Todos foram eliminados.
     */

    if (
      jogadoresAtivosDepois.length ===
      0
    ) {
      console.log(
        `Todos os jogadores foram eliminados na partida ${codigo}.`,
      );

      await this.finalizarPartida(
        codigo,
        sala.id,
      );

      return;
    }

    /*
     * =====================================================
     * ÚLTIMA RODADA
     * =====================================================
     */

    if (
      estado.rodadaAtual >=
      rodadas.length - 1
    ) {
      console.log(
        `Última rodada concluída na partida ${codigo}.`,
      );

      await this.finalizarPartida(
        codigo,
        sala.id,
      );

      return;
    }

    /*
     * =====================================================
     * NÃO FINALIZAR COM 1 JOGADOR
     * =====================================================
     */

    console.log(
      `Partida ${codigo}: ${jogadoresAtivosDepois.length} jogador(es) ativo(s).`,
    );

    /*
     * =====================================================
     * PRÓXIMA RODADA
     * =====================================================
     */

    estado.rodadaAtual++;

    estado.iniciadaEm = 0;

    estado.terminaEm = 0;

    estado.jogadoresQueResponderam =
      new Set<number>();

    const proximaRodada =
      rodadas[
      estado.rodadaAtual
      ];

    if (!proximaRodada) {
      await this.finalizarPartida(
        codigo,
        sala.id,
      );

      return;
    }

    console.log(
      `Partida ${codigo} avançando para a rodada ${estado.rodadaAtual + 1
      }.`,
    );

    /*
     * Esperar 2 segundos para
     * mostrar o resultado.
     */

    setTimeout(
      async () => {
        try {
          const estadoAtual =
            this.partidas.get(
              codigo,
            );

          if (
            !estadoAtual ||
            estadoAtual.finalizando
          ) {
            return;
          }

          estadoAtual.encerrando =
            false;

          await this.iniciarRodada(
            codigo,
            rodadas,
          );
        } catch (error) {
          console.error(
            'Erro ao iniciar próxima rodada:',
            error,
          );
        }
      },
      2000,
    );
  }

  /*
   * =========================================================
   * OBTER ID DA SALA
   * =========================================================
   */

  private async obterSalaId(
    codigo: string,
  ): Promise<number> {
    const sala =
      await this.prisma.sala.findUnique({
        where: {
          codigo,
        },

        select: {
          id: true,
        },
      });

    if (!sala) {
      throw new BadRequestException(
        'Sala não encontrada.',
      );
    }

    return sala.id;
  }
}