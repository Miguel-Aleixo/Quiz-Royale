import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PartidaService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  async iniciar(codigo: string, usuarioId: number) {
    // 1. Buscar a sala
    const sala = await this.prisma.sala.findUnique({
      where: {
        codigo: codigo.toUpperCase(),
      },
      include: {
        jogadores: true,
        rodadas: {
          orderBy: {
            ordem: 'asc',
          },
          include: {
            pergunta: {
              include: {
                alternativas: true,
              },
            },
          },
        },
      },
    });

    // 2. Verificar se a sala existe
    if (!sala) {
      throw new NotFoundException(
        'Sala não encontrada',
      );
    }

    // 3. Verificar se quem está iniciando é o criador
    if (sala.criadorId !== usuarioId) {
      throw new BadRequestException(
        'Apenas o criador da sala pode iniciar a partida',
      );
    }

    // 4. Verificar o status
    if (sala.status !== 'ABERTA') {
      throw new BadRequestException(
        'Essa sala não está disponível para iniciar',
      );
    }

    // 5. Verificar se existem jogadores
    if (sala.jogadores.length === 0) {
      throw new BadRequestException(
        'É necessário ter pelo menos um jogador na sala',
      );
    }

    // 6. Verificar se existem rodadas
    if (sala.rodadas.length === 0) {
      throw new BadRequestException(
        'Essa sala não possui perguntas cadastradas',
      );
    }

    // 7. Alterar status da sala
    const salaAtualizada = await this.prisma.sala.update({
      where: {
        id: sala.id,
      },
      data: {
        status: 'ANDAMENTO',
      },
    });

    // 8. Retornar resultado
    return {
      mensagem: 'Partida iniciada',
      sala: {
        id: salaAtualizada.id,
        nome: salaAtualizada.nome,
        codigo: salaAtualizada.codigo,
        status: salaAtualizada.status,
      },
      quantidadeRodadas: sala.rodadas.length,
      rodadas: sala.rodadas,
    };
  }
}