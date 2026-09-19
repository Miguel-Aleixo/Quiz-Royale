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

  // =========================================================
  // AUTENTICAÇÃO DO SOCKET
  // =========================================================

  handleConnection(socket: Socket) {
    try {
      const token = socket.handshake.auth?.token;

      if (!token) {
        socket.emit('erro_partida', {
          mensagem: 'Token não informado.',
        });

        socket.disconnect();

        return;
      }

      const tokenLimpo = token.replace(
        'Bearer ',
        '',
      );

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

      // jwt.verify() pode retornar string
      if (
        typeof decoded === 'string' ||
        !decoded.sub
      ) {
        throw new UnauthorizedException(
          'Token inválido.',
        );
      }

      // O sub do JWT representa o ID do Usuario
      socket.data.usuarioId = Number(decoded.sub);

      console.log(
        `Socket autenticado - Usuario: ${socket.data.usuarioId}`,
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

  // =========================================================
  // ENTRAR NA PARTIDA
  // =========================================================

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
      const usuarioId = socket.data.usuarioId;

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

      const codigo = data.codigo.toUpperCase();

      // -------------------------------------------------------
      // BUSCAR SALA
      // -------------------------------------------------------

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
        throw new BadRequestException(
          'Sala não encontrada.',
        );
      }

      // -------------------------------------------------------
      // VERIFICAR STATUS
      // -------------------------------------------------------

      if (sala.status !== 'ANDAMENTO') {
        throw new BadRequestException(
          'A partida ainda não foi iniciada.',
        );
      }

      // -------------------------------------------------------
      // VERIFICAR RODADAS
      // -------------------------------------------------------

      if (sala.rodadas.length === 0) {
        throw new BadRequestException(
          'Essa partida não possui rodadas.',
        );
      }

      // -------------------------------------------------------
      // BUSCAR JOGADOR
      // -------------------------------------------------------
      //
      // JWT -> Usuario.id
      //
      // Mas Resposta usa Jogador.id.
      //
      // Então procuramos o Jogador através de:
      //
      // usuarioId + salaId
      //
      // -------------------------------------------------------

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

      // -------------------------------------------------------
      // COLOCAR SOCKET NA SALA
      // -------------------------------------------------------

      socket.join(`partida:${codigo}`);

      // -------------------------------------------------------
      // PRIMEIRA RODADA
      // -------------------------------------------------------

      const primeiraRodada =
        sala.rodadas[0];

      socket.emit('pergunta', {
        rodada: primeiraRodada,

        numeroRodada: 1,

        totalRodadas:
          sala.rodadas.length,
      });

      console.log(
        `Jogador ${jogador.id} entrou na partida ${codigo}`,
      );
    } catch (error) {
      socket.emit('erro_partida', {
        mensagem:
          error instanceof Error
            ? error.message
            : 'Erro ao entrar na partida.',
      });
    }
  }

  // =========================================================
  // RESPONDER PERGUNTA
  // =========================================================

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
      // -------------------------------------------------------
      // PEGAR USUARIO DO JWT
      // -------------------------------------------------------

      const usuarioId = socket.data.usuarioId;

      if (!usuarioId) {
        throw new UnauthorizedException(
          'Usuário não autenticado.',
        );
      }

      // -------------------------------------------------------
      // VALIDAR DADOS
      // -------------------------------------------------------

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

      // -------------------------------------------------------
      // BUSCAR SALA
      // -------------------------------------------------------

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

      // -------------------------------------------------------
      // BUSCAR JOGADOR
      // -------------------------------------------------------
      //
      // IMPORTANTE:
      //
      // usuarioId vem do JWT.
      //
      // jogadorId é o ID da tabela Jogador.
      //
      // -------------------------------------------------------

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

      // -------------------------------------------------------
      // BUSCAR RODADA
      // -------------------------------------------------------

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

      // -------------------------------------------------------
      // VERIFICAR SE A RODADA PERTENCE À SALA
      // -------------------------------------------------------

      if (rodada.salaId !== sala.id) {
        throw new BadRequestException(
          'Essa rodada não pertence a essa sala.',
        );
      }

      // -------------------------------------------------------
      // BUSCAR ALTERNATIVA
      // -------------------------------------------------------

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

      // -------------------------------------------------------
      // VERIFICAR SE ALTERNATIVA PERTENCE À PERGUNTA
      // -------------------------------------------------------

      if (
        alternativa.perguntaId !==
        rodada.perguntaId
      ) {
        throw new BadRequestException(
          'Essa alternativa não pertence à pergunta atual.',
        );
      }

      // -------------------------------------------------------
      // VERIFICAR SE JÁ RESPONDEU
      // -------------------------------------------------------

      const respostaExistente =
        await this.prisma.resposta.findFirst({
          where: {
            jogadorId: jogador.id,

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

      // -------------------------------------------------------
      // CRIAR RESPOSTA
      // -------------------------------------------------------

      const resposta =
        await this.prisma.resposta.create({
          data: {
            jogadorId: jogador.id,

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

      // -------------------------------------------------------
      // VERIFICAR RESULTADO
      // -------------------------------------------------------

      const correta =
        resposta.alternativa.correta;

      // -------------------------------------------------------
      // ENVIAR RESULTADO PARA O JOGADOR
      // -------------------------------------------------------

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
        `Jogador ${jogador.id} respondeu a rodada ${rodada.id}: ${
          correta
            ? 'CORRETA'
            : 'INCORRETA'
        }`,
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
}