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
}

interface PerguntaSocket {
  rodada: any;
  numeroRodada: number;
  totalRodadas: number;
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
    private readonly usuarioService: UsuarioService
  ) { }

  /*
   * =========================================================
   * CONTROLE DAS PARTIDAS
   * =========================================================
   *
   * Cada sala possui seu próprio estado:
   *
   * codigo da sala
   *      ↓
   * rodada atual
   *      ↓
   * timer
   *      ↓
   * controle de encerramento
   *
   */

  private partidas = new Map<
    string,
    RodadaState
  >();

  /*
   * =========================================================
   * AUTENTICAÇÃO DO SOCKET
   * =========================================================
   */

  handleConnection(socket: Socket) {
    try {
      const token =
        socket.handshake.auth?.token;

      if (!token) {
        socket.emit('erro_partida', {
          mensagem:
            'Token não informado.',
        });

        socket.disconnect();

        return;
      }

      const tokenLimpo =
        token.replace(
          'Bearer ',
          '',
        );

      const secret =
        process.env.JWT_SECRET;

      if (!secret) {
        throw new UnauthorizedException(
          'JWT_SECRET não configurado.',
        );
      }

      const decoded =
        jwt.verify(
          tokenLimpo,
          secret,
        );

      /*
       * jwt.verify() pode retornar
       * uma string.
       */

      if (
        typeof decoded === 'string' ||
        !decoded.sub
      ) {
        throw new UnauthorizedException(
          'Token inválido.',
        );
      }

      /*
       * O sub do JWT é o ID do Usuario.
       */

      socket.data.usuarioId =
        Number(decoded.sub);

      console.log(
        `Socket autenticado - Usuario: ${socket.data.usuarioId}`,
      );
    } catch (error) {
      console.error(
        'Erro na autenticação do Socket:',
        error,
      );

      socket.emit(
        'erro_partida',
        {
          mensagem:
            'Sessão inválida ou expirada.',
        },
      );

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
      /*
       * Pegar Usuario pelo JWT
       */

      const usuarioId =
        socket.data.usuarioId;

      if (!usuarioId) {
        throw new UnauthorizedException(
          'Usuário não autenticado.',
        );
      }

      /*
       * Validar código
       */

      if (!data?.codigo) {
        throw new BadRequestException(
          'Código da sala não informado.',
        );
      }

      const codigo =
        data.codigo.toUpperCase();

      /*
       * Buscar sala
       */

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

      /*
       * Verificar status
       */

      if (
        sala.status !==
        'ANDAMENTO'
      ) {
        throw new BadRequestException(
          'A partida ainda não foi iniciada.',
        );
      }

      /*
       * Verificar rodadas
       */

      if (
        sala.rodadas.length === 0
      ) {
        throw new BadRequestException(
          'Essa partida não possui rodadas.',
        );
      }

      /*
       * Verificar se o usuário
       * realmente está na sala.
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
       * Entrar na room do Socket.IO
       */

      socket.join(
        `partida:${codigo}`,
      );

      /*
       * Verificar se essa partida
       * já possui estado.
       */

      let estado =
        this.partidas.get(codigo);

      /*
       * Se não existe estado,
       * começamos na primeira rodada.
       */

      if (!estado) {
        estado = {
          rodadaAtual: 0,
          timer: null,
          encerrando: false,
        };

        this.partidas.set(
          codigo,
          estado,
        );

        /*
         * Começa a primeira rodada.
         */

        await this.iniciarRodada(
          codigo,
          sala.rodadas,
        );

        return;
      }

      /*
       * Se a partida já estava acontecendo,
       * enviamos a rodada atual somente
       * para esse jogador.
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

      socket.emit(
        'pergunta',
        {
          rodada: rodadaAtual,
          numeroRodada:
            estado.rodadaAtual + 1,
          totalRodadas:
            sala.rodadas.length,
        } satisfies PerguntaSocket,
      );

      console.log(
        `Jogador ${jogador.id} entrou na partida ${codigo} na rodada ${estado.rodadaAtual + 1
        }`,
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

    const rodada =
      rodadas[
      estado.rodadaAtual
      ];

    if (!rodada) {
      return;
    }

    /*
     * Limpar timer anterior
     */

    if (estado.timer) {
      clearTimeout(
        estado.timer,
      );
    }

    estado.encerrando = false;

    /*
     * Enviar pergunta para todos
     * os jogadores da sala.
     */

    this.server
      .to(`partida:${codigo}`)
      .emit(
        'pergunta',
        {
          rodada,
          numeroRodada:
            estado.rodadaAtual + 1,
          totalRodadas:
            rodadas.length,
        } satisfies PerguntaSocket,
      );

    console.log(
      `Partida ${codigo} iniciou a rodada ${estado.rodadaAtual + 1
      }`,
    );

    /*
     * Timer da rodada
     */

    estado.timer =
      setTimeout(
        async () => {
          try {
            await this.encerrarRodada(
              codigo,
              rodadas,
            );
          } catch (error) {
            console.error(
              'Erro ao encerrar rodada pelo timer:',
              error,
            );
          }
        },
        rodada.tempoLimite *
        1000,
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
      /*
       * Usuario vindo do JWT
       */

      const usuarioId =
        socket.data.usuarioId;

      if (!usuarioId) {
        throw new UnauthorizedException(
          'Usuário não autenticado.',
        );
      }

      /*
       * Validar dados
       */

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
       * Verificar estado da partida
       */

      const estado =
        this.partidas.get(codigo);

      if (!estado) {
        throw new BadRequestException(
          'A partida não está em andamento.',
        );
      }

      /*
       * Buscar sala
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
       * Buscar jogador
       *
       * Usuario.id -> Jogador.id
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
       * Buscar rodada
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
       * Verificar se é a rodada atual
       */

      const rodadaAtualBanco =
        await this.prisma.rodada.findFirst({
          where: {
            salaId: sala.id,
            ordem:
              rodada.ordem,
          },
        });

      if (
        !rodadaAtualBanco
      ) {
        throw new BadRequestException(
          'Rodada inválida.',
        );
      }

      /*
       * Verificar se a rodada pertence
       * à sala.
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
       * Verificar se o jogador
       * está respondendo a rodada atual.
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
       * Buscar alternativa
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

      /*
       * Verificar se a alternativa
       * pertence à pergunta.
       */

      if (
        alternativa.perguntaId !==
        rodada.perguntaId
      ) {
        throw new BadRequestException(
          'Essa alternativa não pertence à pergunta atual.',
        );
      }

      /*
       * Verificar se já respondeu
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
       * Criar resposta
       */

      const resposta =
        await this.prisma.resposta.create({
          data: {
            jogadorId:
              jogador.id,

            alternativaId:
              data.alternativaId,

            tempoResposta:
              data.tempoResposta,
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

      /*
       * Verificar se acertou
       */

      const correta =
        resposta.alternativa.correta;

      /*
       * =====================================================
       * PONTUAÇÃO
       * =====================================================
       *
       * Acertou = +100
       * Errou   = +0
       *
       */

      if (correta) {
        const usuarioAtualizado =
          await this.prisma.usuario.update({
            where: {
              id: usuarioId,
            },
            data: {
              pontuacao: {
                increment: 100,
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
         * Buscar a maior patente que o jogador
         * já alcançou com a pontuação atual.
         */
        const novaPatente =
          await this.prisma.patente.findFirst({
            where: {
              pontos: {
                lte: usuarioAtualizado.pontuacao,
              },
            },
            orderBy: {
              pontos: 'desc',
            },
          });

        /*
         * Atualizar a patente somente se
         * existir uma patente compatível e
         * ela for diferente da atual.
         */
        if (
          novaPatente &&
          novaPatente.id !== usuarioAtualizado.patenteId
        ) {
          await this.prisma.usuario.update({
            where: {
              id: usuarioId,
            },
            data: {
              patenteId: novaPatente.id,
            },
          });

          console.log(
            `Usuário ${usuarioAtualizado.nome} subiu para a patente ${novaPatente.nome}!`,
          );
        }

        console.log(
          `Pontuação de ${usuarioAtualizado.nome}: ${usuarioAtualizado.pontuacao}`,
        );
      }

      /*
       * Enviar resultado somente
       * para o jogador que respondeu.
       */

      socket.emit(
        'resultado_resposta',
        {
          correta,
          alternativaId:
            data.alternativaId,
          rodadaId:
            data.rodadaId,
        },
      );

      console.log(
        `Jogador ${jogador.id} respondeu a rodada ${rodada.id}: ${correta
          ? 'CORRETA (+100)'
          : 'INCORRETA (+0)'
        }`,
      );

      /*
       * Verificar se todos os jogadores
       * já responderam.
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
   * VERIFICAR SE TODOS RESPONDERAM
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

    /*
     * Se já está encerrando,
     * não faz novamente.
     */

    if (estado.encerrando) {
      return;
    }

    /*
     * Buscar todos os jogadores
     * da sala.
     */

    const jogadores =
      await this.prisma.jogador.findMany({
        where: {
          salaId,
        },

        select: {
          id: true,
        },
      });

    if (
      jogadores.length === 0
    ) {
      return;
    }

    /*
     * Buscar respostas da rodada
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

    /*
     * Jogadores únicos que responderam
     */

    const jogadoresQueResponderam =
      new Set(
        respostas.map(
          (resposta) =>
            resposta.jogadorId,
        ),
      );

    console.log(
      `Rodada ${rodadaId}: ${jogadoresQueResponderam.size}/${jogadores.length} jogadores responderam.`,
    );

    /*
     * Se todos responderam,
     * encerra imediatamente.
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
   * ENCERRAR RODADA
   * =========================================================
   */

  private async encerrarRodada(
    codigo: string,
    rodadasExternas?: any[],
  ) {
    const estado =
      this.partidas.get(codigo);

    if (!estado) {
      return;
    }

    /*
     * Impede duas execuções
     * simultâneas.
     */

    if (estado.encerrando) {
      return;
    }

    estado.encerrando = true;

    /*
     * Limpar timer
     */

    if (estado.timer) {
      clearTimeout(
        estado.timer,
      );

      estado.timer = null;
    }

    /*
     * Buscar sala novamente
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

    /*
     * Usar rodadas atualizadas do banco.
     */

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
     * Se acabou a última rodada.
     */

    if (
      estado.rodadaAtual >=
      rodadas.length - 1
    ) {
      console.log(
        `Partida ${codigo} finalizada.`,
      );

      /*
       * Atualizar status da sala.
       */

      await this.prisma.sala.update({
        where: {
          id: sala.id,
        },

        data: {
          status: 'FINALIZADA',
        },
      });

      /*
       * Buscar ranking final.
       */

      const jogadores =
        await this.prisma.jogador.findMany({
          where: {
            salaId: sala.id,
          },

          include: {
            usuario: {
              select: {
                id: true,
                nome: true,
                pontuacao: true,
              },
            },
          },
        });

      const ranking =
        jogadores
          .sort(
            (a, b) =>
              (b.usuario.pontuacao ??
                0) -
              (a.usuario.pontuacao ??
                0),
          )
          .map(
            (
              jogador,
              index,
            ) => ({
              posicao:
                index + 1,

              jogadorId:
                jogador.id,

              usuarioId:
                jogador.usuario.id,

              nome:
                jogador.usuario
                  .nome,

              pontuacao:
                jogador.usuario
                  .pontuacao ??
                0,
            }),
          );

      /*
       * Avisar todos os jogadores.
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
       * Limpar estado da partida.
       */

      this.partidas.delete(
        codigo,
      );

      return;
    }

    /*
     * =======================================================
     * PRÓXIMA RODADA
     * =======================================================
     */

    estado.rodadaAtual++;

    estado.encerrando = false;

    const proximaRodada =
      rodadas[
      estado.rodadaAtual
      ];

    console.log(
      `Partida ${codigo} avançando para a rodada ${estado.rodadaAtual + 1
      }`,
    );

    /*
     * Pequeno intervalo antes
     * da próxima pergunta.
     *
     * Isso dá tempo para o frontend
     * mostrar o resultado.
     */

    setTimeout(
      async () => {
        try {
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
}