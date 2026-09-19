import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';

import { Server, Socket } from 'socket.io';

import { PrismaService } from '../prisma/prisma.service';
import { PartidaService } from './partida.service';

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
    private readonly partidaService: PartidaService,
  ) {}

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
    });

    if (!sala) {
      socket.emit('erro_partida', {
        mensagem: 'Sala não encontrada.',
      });

      return;
    }

    if (sala.status !== 'ANDAMENTO') {
      socket.emit('erro_partida', {
        mensagem: 'A partida ainda não começou.',
      });

      return;
    }

    socket.join(`partida:${codigo}`);

    const partida = await this.prisma.sala.findUnique({
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

    if (!partida || partida.rodadas.length === 0) {
      socket.emit('erro_partida', {
        mensagem: 'Nenhuma rodada encontrada.',
      });

      return;
    }

    // Primeira rodada
    const primeiraRodada = partida.rodadas[0];

    socket.emit('pergunta', {
      rodada: primeiraRodada,
      numeroRodada: 1,
      totalRodadas: partida.rodadas.length,
    });
  }
}