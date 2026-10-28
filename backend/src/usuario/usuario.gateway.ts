
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Server, Socket } from 'socket.io';

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

  constructor(private readonly jwtService: JwtService) {}

  async handleConnection(client: Socket): Promise<void> {
    try {
      // Tenta obter o token do handshake ou do cookie.
      const token =
        client.handshake.auth?.token ||
        this.obterTokenDoCookie(client);

      if (!token) {
        client.disconnect(true);
        return;
      }

      const payload = await this.jwtService.verifyAsync(token);

      // Ajuste "sub" caso seu JWT utilize outra propriedade para o ID.
      const usuarioId = Number(payload.sub ?? payload.id);

      if (!Number.isInteger(usuarioId) || usuarioId <= 0) {
        client.disconnect(true);
        return;
      }

      client.data.usuarioId = usuarioId;

      await this.emitirJogadoresOnline();

      this.logger.log(`Usuário ${usuarioId} conectado à presença.`);
    } catch {
      client.disconnect(true);
    }
  }

  async handleDisconnect(): Promise<void> {
    await this.emitirJogadoresOnline();
  }

  private async emitirJogadoresOnline(): Promise<void> {
    const sockets = await this.server.fetchSockets();
    const usuarios = new Set<number>();

    for (const socket of sockets) {
      const usuarioId = Number(socket.data?.usuarioId);

      if (Number.isInteger(usuarioId) && usuarioId > 0) {
        usuarios.add(usuarioId);
      }
    }

    this.server.emit('jogadores_online', {
      total: usuarios.size,
    });
  }

  private obterTokenDoCookie(client: Socket): string | undefined {
    const cookies = client.handshake.headers.cookie;

    if (!cookies) return undefined;

    const tokenCookie = cookies
      .split(';')
      .map((cookie) => cookie.trim())
      .find((cookie) => cookie.startsWith('token='));

    return tokenCookie
      ? decodeURIComponent(tokenCookie.substring('token='.length))
      : undefined;
  }
}
