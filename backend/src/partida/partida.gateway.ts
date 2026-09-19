import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { BadRequestException } from '@nestjs/common';
import { Server, Socket } from 'socket.io';

import { PrismaService } from '../prisma/prisma.service';

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
  ) {}

  /*
   * Jogador entra na partida
   */
  @SubscribeMessage('entrar_partida')
  async entrarPartida(
    @MessageBody() data: { codigo: string },
    @ConnectedSocket() socket: Socket,
  ) {
    const codigo = data.codigo.toUpperCase();

    const sala = await this.prisma.sala.findUnique({
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
      socket.emit('erro_partida', {
        mensagem: 'Sala não encontrada.',
      });

      return;
    }

    if (sala.status !== 'ANDAMENTO') {
      socket.emit('erro_partida', {
        mensagem: 'A partida ainda não foi iniciada.',
      });

      return;
    }

    if (sala.rodadas.length === 0) {
      socket.emit('erro_partida', {
        mensagem: 'Essa partida não possui rodadas.',
      });

      return;
    }

    /*
     * Coloca o jogador na sala do Socket
     */
    socket.join(`partida:${codigo}`);

    /*
     * Envia a primeira pergunta
     */
    const primeiraRodada = sala.rodadas[0];

    socket.emit('pergunta', {
      rodada: primeiraRodada,
      numeroRodada: 1,
      totalRodadas: sala.rodadas.length,
    });
  }

  /*
   * Jogador responde uma pergunta
   */
  @SubscribeMessage('responder')
  async responder(
    @MessageBody()
    data: {
      codigo: string;
      jogadorId: number;
      alternativaId: number;
      rodadaId: number;
      tempoResposta: number;
    },
    @ConnectedSocket() socket: Socket,
  ) {
    try {
      const codigo = data.codigo.toUpperCase();

      /*
       * Verifica a sala
       */
      const sala = await this.prisma.sala.findUnique({
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
       * Verifica o jogador
       */
      const jogador = await this.prisma.jogador.findUnique({
        where: {
          id: data.jogadorId,
        },
      });

      if (!jogador) {
        throw new BadRequestException(
          'Jogador não encontrado.',
        );
      }

      /*
       * Confirma que o jogador pertence à sala
       */
      if (jogador.salaId !== sala.id) {
        throw new BadRequestException(
          'Esse jogador não pertence à sala.',
        );
      }

      /*
       * Verifica a alternativa
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
       * Verifica a rodada
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
       * Confirma que a alternativa pertence
       * à pergunta da rodada
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
       * Impede resposta duplicada
       */
      const respostaExistente =
        await this.prisma.resposta.findFirst({
          where: {
            jogadorId: data.jogadorId,
            alternativa: {
              perguntaId: rodada.perguntaId,
            },
          },
        });

      if (respostaExistente) {
        throw new BadRequestException(
          'Você já respondeu essa pergunta.',
        );
      }

      /*
       * Salva a resposta
       */
      const resposta =
        await this.prisma.resposta.create({
          data: {
            jogadorId: data.jogadorId,
            alternativaId: data.alternativaId,
            tempoResposta: data.tempoResposta,
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
       * Resultado da resposta
       */
      const correta =
        resposta.alternativa.correta;

      socket.emit('resultado_resposta', {
        correta,
        alternativaId: data.alternativaId,
        rodadaId: data.rodadaId,
      });

    } catch (error) {
      socket.emit('erro_resposta', {
        mensagem:
          error instanceof Error
            ? error.message
            : 'Erro ao registrar resposta.',
      });
    }
  }
}