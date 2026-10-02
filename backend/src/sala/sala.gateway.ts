import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';

import {
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
export class SalaGateway {
  @WebSocketServer()
  server!: Server;

  constructor(
    private readonly prisma: PrismaService,
  ) {}

  // ==========================================
  // VERIFICAR USUÁRIO
  // ==========================================

  private async verificarUsuario(socket: Socket) {
    const token =
      socket.handshake.auth?.token;

    if (!token) {
      throw new UnauthorizedException(
        'Token não informado.',
      );
    }

    const tokenLimpo =
      token.replace('Bearer ', '');

    const secret =
      process.env.JWT_SECRET;

    if (!secret) {
      throw new Error(
        'JWT_SECRET não foi configurado.',
      );
    }

    let payload: any;

    try {
      payload = jwt.verify(
        tokenLimpo,
        secret,
      );
    } catch {
      throw new UnauthorizedException(
        'Token inválido ou expirado.',
      );
    }

    if (!payload?.sub) {
      throw new UnauthorizedException(
        'Token inválido.',
      );
    }

    const usuario =
      await this.prisma.usuario.findUnique({
        where: {
          id: Number(payload.sub),
        },

        select: {
          id: true,
          nome: true,
          email: true,
          role: true,
          emailVerificado: true,
        },
      });

    if (!usuario) {
      throw new UnauthorizedException(
        'Usuário não encontrado.',
      );
    }

    if (!usuario.emailVerificado) {
      throw new UnauthorizedException(
        'Você precisa verificar seu e-mail para jogar.',
      );
    }

    return usuario;
  }

  @SubscribeMessage('entrar_sala')
  async entrarSala(
    @MessageBody()
    data: {
      codigo: string;
    },

    @ConnectedSocket()
    socket: Socket,
  ) {
    // ==========================================
    // PROTEÇÃO
    // ==========================================

    try {
      await this.verificarUsuario(socket);
    } catch (error) {
      socket.emit('erro_sala', {
        mensagem:
          error instanceof UnauthorizedException
            ? error.message
            : 'Não foi possível autenticar o usuário.',
      });

      return;
    }

    // ==========================================
    // LÓGICA ORIGINAL
    // ==========================================

    const codigo =
      data.codigo.toUpperCase();

    const sala =
      await this.prisma.sala.findUnique({
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

    console.log(
      `Socket ${socket.id} entrou na sala ${codigo}`,
    );

    // Atualiza todos que estão na sala
    this.server
      .to(`sala:${codigo}`)
      .emit('sala_atualizada', {
        id: sala.id,
        nome: sala.nome,
        codigo: sala.codigo,
        status: sala.status,
        maxJogadores: sala.maxJogadores,
        criador: sala.criador,
        jogadores: sala.jogadores,
      });
  }

  /*
   * =========================================================
   * AVISAR QUE A PARTIDA COMEÇOU
   * =========================================================
   */

  avisarPartidaIniciada(
    codigo: string,
  ) {
    const codigoNormalizado =
      codigo.toUpperCase();

    console.log(
      `Partida iniciada na sala ${codigoNormalizado}`,
    );

    this.server
      .to(`sala:${codigoNormalizado}`)
      .emit('partida_iniciada', {
        codigo: codigoNormalizado,
      });
  }

  /*
   * =========================================================
   * AVISAR SALA FECHADA
   * =========================================================
   */

  avisarSalaFechada(
    codigo: string,
  ) {
    const codigoNormalizado =
      codigo.toUpperCase();

    console.log(
      `Sala ${codigoNormalizado} foi fechada pelo criador`,
    );

    this.server
      .to(`sala:${codigoNormalizado}`)
      .emit('sala_fechada', {
        codigo: codigoNormalizado,

        mensagem:
          'A sala foi fechada.',
      });
  }
}
