
import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';

import {
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

import { Server, Socket } from 'socket.io';
import * as jwt from 'jsonwebtoken';

import { PrismaService } from '../prisma/prisma.service';

interface UsuarioChat {
  id: number;
  nome: string;
}

interface MensagemChat {
  id: string;
  usuarioId: number;
  nome: string;
  texto: string;
  criadoEm: string;
}

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
@Injectable()
export class SalaGateway {
  @WebSocketServer()
  server!: Server;

  private historicoChat = new Map<string, MensagemChat[]>();

  constructor(
    private readonly prisma: PrismaService,
  ) { }

  // ==========================================
  // AUTENTICAÇÃO
  // ==========================================

  private async verificarUsuario(
    socket: Socket,
  ): Promise<UsuarioChat> {
    const token = socket.handshake.auth?.token;

    if (!token || typeof token !== 'string') {
      throw new UnauthorizedException(
        'Token não informado.',
      );
    }

    const tokenLimpo = token.replace(/^Bearer\s+/i, '');
    const secret = process.env.JWT_SECRET;

    if (!secret) {
      throw new Error(
        'JWT_SECRET não foi configurado.',
      );
    }

    let payload: any;

    try {
      payload = jwt.verify(tokenLimpo, secret);
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

    const usuario = await this.prisma.usuario.findUnique({
      where: {
        id: Number(payload.sub),
      },
      select: {
        id: true,
        nome: true,
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

    return {
      id: usuario.id,
      nome: usuario.nome,
    };
  }

  // ==========================================
  // VERIFICAR PARTICIPAÇÃO NA SALA
  // ==========================================

  private async verificarParticipacao(
    codigo: string,
    usuarioId: number,
  ) {
    const sala = await this.prisma.sala.findUnique({
      where: {
        codigo,
      },
      include: {
        jogadores: {
          select: {
            usuarioId: true,
          },
        },
      },
    });

    if (!sala) {
      throw new Error('Sala não encontrada.');
    }

    if (sala.status !== 'ABERTA') {
      throw new Error(
        'O chat está disponível somente no lobby.',
      );
    }

    const participa =
      sala.criadorId === usuarioId ||
      sala.jogadores.some(
        (jogador) => jogador.usuarioId === usuarioId,
      );

    if (!participa) {
      throw new Error(
        'Você não participa desta sala.',
      );
    }

    return sala;
  }

  // ==========================================
  // ENTRAR NA SALA
  // ==========================================

  @SubscribeMessage('entrar_sala')
  async entrarSala(
    @MessageBody() data: { codigo: string },
    @ConnectedSocket() socket: Socket,
  ) {
    try {
      const usuario = await this.verificarUsuario(socket);

      socket.data.usuarioId = usuario.id;

      const codigo =
        typeof data?.codigo === 'string'
          ? data.codigo.trim().toUpperCase()
          : '';

      if (!codigo) {
        throw new Error('Código da sala inválido.');
      }

      const sala = await this.prisma.sala.findUnique({
        where: { codigo },
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
        throw new Error('Sala não encontrada.');
      }

      if (sala.status !== 'ABERTA') {
        throw new Error(
          'Essa sala não está aberta.',
        );
      }

      const participa =
        sala.criadorId === usuario.id ||
        sala.jogadores.some(
          (jogador) => jogador.usuarioId === usuario.id,
        );

      if (!participa) {
        throw new Error(
          'Você não participa desta sala.',
        );
      }

      await socket.join(`sala:${codigo}`);

      console.log(
        `Socket ${socket.id} entrou na sala ${codigo}`,
      );

      socket.emit(
        'historico_chat',
        this.historicoChat.get(codigo) ?? [],
      );

      this.server.to(`sala:${codigo}`).emit(
        'sala_atualizada',
        {
          id: sala.id,
          nome: sala.nome,
          codigo: sala.codigo,
          status: sala.status,
          maxJogadores: sala.maxJogadores,
          criador: sala.criador,
          jogadores: sala.jogadores,
        },
      );
    } catch (error) {
      socket.emit('erro_sala', {
        mensagem:
          error instanceof Error
            ? error.message
            : 'Não foi possível entrar na sala.',
      });
    }
  }

  // ==========================================
  // ENVIAR MENSAGEM NO CHAT
  // ==========================================

  @SubscribeMessage('enviar_mensagem')
  async enviarMensagem(
    @MessageBody()
    data: {
      codigo: string;
      texto: string;
    },
    @ConnectedSocket() socket: Socket,
  ) {
    try {
      const usuario = await this.verificarUsuario(socket);

      const codigo =
        typeof data?.codigo === 'string'
          ? data.codigo.trim().toUpperCase()
          : '';

      const texto =
        typeof data?.texto === 'string'
          ? data.texto.trim()
          : '';

      if (!codigo || !socket.rooms.has(`sala:${codigo}`)) {
        throw new Error(
          'Entre na sala antes de enviar mensagens.',
        );
      }

      if (!texto) {
        throw new Error(
          'Digite uma mensagem.',
        );
      }

      if (texto.length > 300) {
        throw new Error(
          'A mensagem deve ter no máximo 300 caracteres.',
        );
      }

      await this.verificarParticipacao(
        codigo,
        usuario.id,
      );

      const mensagem: MensagemChat = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        usuarioId: usuario.id,
        nome: usuario.nome,
        texto,
        criadoEm: new Date().toISOString(),
      };

      const historico = this.historicoChat.get(codigo) ?? [];

      historico.push(mensagem);

      // Mantém somente as últimas 100 mensagens por sala.
      this.historicoChat.set(
        codigo,
        historico.slice(-100),
      );

      this.server
        .to(`sala:${codigo}`)
        .emit('nova_mensagem', mensagem);
    } catch (error) {
      socket.emit('erro_chat', {
        mensagem:
          error instanceof Error
            ? error.message
            : 'Não foi possível enviar a mensagem.',
      });
    }
  }

  // ==========================================
  // REMOVER JOGADOR DA SALA
  // ==========================================

  @SubscribeMessage('remover_jogador')
  async removerJogador(
    @MessageBody()
    data: {
      codigo: string;
      usuarioId: number;
    },
    @ConnectedSocket() socket: Socket,
  ) {
    try {
      const usuario = await this.verificarUsuario(socket);

      const codigo =
        typeof data?.codigo === 'string'
          ? data.codigo.trim().toUpperCase()
          : '';

      const jogadorId = Number(data?.usuarioId);

      if (!codigo) {
        throw new Error('Código da sala inválido.');
      }

      if (!Number.isInteger(jogadorId) || jogadorId <= 0) {
        throw new Error('Jogador inválido.');
      }

      // Busca a sala e seus participantes.
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
        throw new Error('Sala não encontrada.');
      }

      // Somente o criador pode remover participantes.
      if (Number(sala.criadorId) !== Number(usuario.id)) {
        throw new Error(
          'Somente o criador da sala pode remover jogadores.',
        );
      }

      // Não permite remover o próprio criador.
      if (Number(jogadorId) === Number(sala.criadorId)) {
        throw new Error(
          'Você não pode remover o criador da sala.',
        );
      }

      if (sala.status !== 'ABERTA') {
        throw new Error(
          'Não é possível remover jogadores após o início da partida.',
        );
      }

      // Verifica se o jogador está na sala.
      const jogadorExiste = sala.jogadores.some(
        (jogador) => Number(jogador.usuarioId) === jogadorId,
      );

      if (!jogadorExiste) {
        throw new Error(
          'Esse jogador não está participando da sala.',
        );
      }

      // Remove o participante do banco de dados.
      await this.prisma.sala.update({
        where: {
          id: sala.id,
        },
        data: {
          jogadores: {
            deleteMany: {
              usuarioId: jogadorId,
            },
          },
        },
      });

      const nomeJogador = sala.jogadores.find(
        (jogador) => Number(jogador.usuarioId) === jogadorId,
      )?.usuario.nome;

      const salaRoom = `sala:${codigo}`;

      // Localiza todos os sockets desse jogador na sala.
      const socketsDaSala =
        await this.server.in(salaRoom).fetchSockets();

      const socketsJogador = socketsDaSala.filter(
        (socketJogador) =>
          Number(socketJogador.data.usuarioId) === jogadorId,
      );

      // Avisa o jogador removido e retira seus sockets da sala.
      for (const socketJogador of socketsJogador) {
        socketJogador.emit('jogador_removido', {
          codigo,
          mensagem: 'O criador removeu você desta sala.',
        });

        await socketJogador.leave(salaRoom);
      }

      // Busca a sala atualizada.
      const salaAtualizada = await this.prisma.sala.findUnique({
        where: {
          id: sala.id,
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

      if (!salaAtualizada) {
        throw new Error('Não foi possível atualizar a sala.');
      }

      // Atualiza a lista de participantes para todos os jogadores.
      this.server.to(salaRoom).emit('sala_atualizada', {
        id: salaAtualizada.id,
        nome: salaAtualizada.nome,
        codigo: salaAtualizada.codigo,
        status: salaAtualizada.status,
        maxJogadores: salaAtualizada.maxJogadores,
        criador: salaAtualizada.criador,
        jogadores: salaAtualizada.jogadores,
      });

      console.log(
        `Jogador ${nomeJogador} (${jogadorId}) removido da sala ${codigo} pelo criador ${usuario.id}.`,
      );

      // Confirma a operação para quem solicitou.
      socket.emit('jogador_removido_sucesso', {
        usuarioId: jogadorId,
        mensagem: `${nomeJogador} foi removido da sala.`,
      });
    } catch (error) {
      socket.emit('erro_sala', {
        mensagem:
          error instanceof Error
            ? error.message
            : 'Não foi possível remover o jogador.',
      });
    }
  }

  // ==========================================
  // AVISAR QUE A PARTIDA COMEÇOU
  // ==========================================

  avisarPartidaIniciada(codigo: string) {
    const codigoNormalizado = codigo.toUpperCase();

    this.server
      .to(`sala:${codigoNormalizado}`)
      .emit('partida_iniciada', {
        codigo: codigoNormalizado,
      });
  }

  // ==========================================
  // AVISAR SALA FECHADA
  // ==========================================

  avisarSalaFechada(codigo: string) {
    const codigoNormalizado = codigo.toUpperCase();

    this.server
      .to(`sala:${codigoNormalizado}`)
      .emit('sala_fechada', {
        codigo: codigoNormalizado,
        mensagem: 'A sala foi fechada.',
      });

    this.historicoChat.delete(codigoNormalizado);
  }
}
