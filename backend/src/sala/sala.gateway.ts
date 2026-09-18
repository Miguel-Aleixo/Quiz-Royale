import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { PrismaService } from '../prisma/prisma.service';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class SalaGateway {
  @WebSocketServer()
  server!: Server;

  constructor(private readonly prisma: PrismaService) {}

  @SubscribeMessage('entrar_sala')
  async entrarSala(
    @MessageBody() data: { codigo: string },
    @ConnectedSocket() socket: Socket,
  ) {
    const codigo = data.codigo.toUpperCase();

    const sala = await this.prisma.sala.findUnique({
      where: {
        codigo,
      },

      include: {
        criador: {
          select: {
            id: true,
            nome: true,
          },
        },

        jogadores: {
          include: {
            usuario: {
              select: {
                id: true,
                nome: true,
                pontuacao: true,
              },
            },
          },
        },
      },
    });

    if (!sala) {
      socket.emit('erro_sala', {
        mensagem: 'Sala não encontrada.',
      });

      return;
    }

    if (sala.status !== 'ABERTA') {
      socket.emit('erro_sala', {
        mensagem: 'Essa sala não está aberta.',
      });

      return;
    }

    // Entra na room do Socket.IO
    socket.join(`sala:${codigo}`);

    // Atualiza todos que estão na sala
    this.server.to(`sala:${codigo}`).emit('sala_atualizada', {
      id: sala.id,
      nome: sala.nome,
      codigo: sala.codigo,
      status: sala.status,
      maxJogadores: sala.maxJogadores,
      criador: sala.criador,
      jogadores: sala.jogadores,
    });
  }
}