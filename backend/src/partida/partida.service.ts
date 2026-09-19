import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PartidaService {
  constructor(private readonly prisma: PrismaService) {}

  async iniciar(codigo: string, usuarioId: number) {
    const sala = await this.prisma.sala.findUnique({
      where: {
        codigo: codigo.toUpperCase(),
      },
      include: {
        jogadores: true,
      },
    });

    if (!sala) {
      throw new NotFoundException('Sala não encontrada');
    }

    if (sala.criadorId !== usuarioId) {
      throw new BadRequestException(
        'Apenas o criador da sala pode iniciar a partida',
      );
    }

    if (sala.status !== 'ABERTA') {
      throw new BadRequestException(
        'Essa sala não está disponível para iniciar',
      );
    }

    if (sala.jogadores.length === 0) {
      throw new BadRequestException(
        'É necessário ter pelo menos um jogador na sala',
      );
    }

    const salaAtualizada = await this.prisma.sala.update({
      where: {
        id: sala.id,
      },
      data: {
        status: 'ANDAMENTO',
      },
    });

    return {
      mensagem: 'Partida iniciada',
      sala: salaAtualizada,
      jogadores: sala.jogadores,
    };
  }
}