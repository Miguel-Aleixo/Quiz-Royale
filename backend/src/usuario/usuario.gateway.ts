
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';

import { Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Server, Socket } from 'socket.io';

// ======================================================
// CONFIGURAÇÃO DO GATEWAY
// ======================================================

/**
 * Gateway responsável pelo gerenciamento da presença
 * dos usuários conectados à plataforma.
 *
 * Evento emitido:
 * - jogadores_online
 *
 * Autenticação:
 * - JWT enviado pelo handshake.auth.token
 * - Cookie de autenticação "token"
 */

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL,
    credentials: true,
  },
})
@Injectable()
export class UsuarioGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(UsuarioGateway.name);

  constructor(
    private readonly jwtService: JwtService,
  ) {}

  // ======================================================
  // CONEXÃO DO USUÁRIO
  // ======================================================

  /**
   * Executado quando um cliente estabelece conexão
   * com o servidor Socket.IO.
   *
   * Valida o JWT e registra o identificador do usuário
   * nos dados da conexão.
   */
  async handleConnection(client: Socket): Promise<void> {
    try {
      const token =
        client.handshake.auth?.token ||
        this.obterTokenDoCookie(client);

      if (!token) {
        this.logger.warn(
          'Conexão recusada: token não informado.',
        );

        client.disconnect(true);
        return;
      }

      const payload = await this.jwtService.verifyAsync(token);

      const usuarioId = Number(
        payload.sub ?? payload.id,
      );

      if (
        !Number.isInteger(usuarioId) ||
        usuarioId <= 0
      ) {
        this.logger.warn(
          'Conexão recusada: identificador de usuário inválido.',
        );

        client.disconnect(true);
        return;
      }

      client.data.usuarioId = usuarioId;

      await this.emitirJogadoresOnline();

      this.logger.log(
        `Usuário ${usuarioId} conectado à presença.`,
      );
    } catch (error) {
      this.logger.warn(
        'Conexão recusada: token inválido ou expirado.',
      );

      client.disconnect(true);
    }
  }

  // ======================================================
  // DESCONEXÃO DO USUÁRIO
  // ======================================================

  /**
   * Executado quando um cliente encerra a conexão.
   *
   * Atualiza a quantidade de jogadores online.
   */
  async handleDisconnect(): Promise<void> {
    await this.emitirJogadoresOnline();
  }

  // ======================================================
  // EMITIR JOGADORES ONLINE
  // ======================================================

  /**
   * Consulta as conexões ativas e contabiliza
   * os usuários únicos conectados.
   *
   * Evento:
   * jogadores_online
   *
   * Estrutura emitida:
   * {
   *   total: number
   * }
   */
  private async emitirJogadoresOnline(): Promise<void> {
    const sockets = await this.server.fetchSockets();

    const usuarios = new Set<number>();

    for (const socket of sockets) {
      const usuarioId = Number(
        socket.data?.usuarioId,
      );

      if (
        Number.isInteger(usuarioId) &&
        usuarioId > 0
      ) {
        usuarios.add(usuarioId);
      }
    }

    this.server.emit('jogadores_online', {
      total: usuarios.size,
    });
  }

  // ======================================================
  // EXTRAIR TOKEN DO COOKIE
  // ======================================================

  /**
   * Obtém o JWT presente no cookie "token"
   * enviado durante o handshake do Socket.IO.
   */
  private obterTokenDoCookie(
    client: Socket,
  ): string | undefined {
    const cookies = client.handshake.headers.cookie;

    if (!cookies) {
      return undefined;
    }

    const tokenCookie = cookies
      .split(';')
      .map((cookie) => cookie.trim())
      .find((cookie) =>
        cookie.startsWith('token='),
      );

    return tokenCookie
      ? decodeURIComponent(
          tokenCookie.substring('token='.length),
        )
      : undefined;
  }
}
