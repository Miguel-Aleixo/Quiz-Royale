import { Injectable } from '@nestjs/common';
import { CreateSalaDto } from './dto/create-sala.dto';
import { UpdateSalaDto } from './dto/update-sala.dto';
import { PrismaService } from '../prisma/prisma.service';
import {
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';

@Injectable()
export class SalaService {
  constructor(private readonly prisma: PrismaService) { }

  async entrar(codigo: string, usuarioId: number) {
    const sala = await this.prisma.sala.findUnique({
      where: {
        codigo: codigo.toUpperCase(),
      },
      include: {
        _count: {
          select: {
            jogadores: true,
          },
        },
      },
    });

    if (!sala) {
      throw new NotFoundException('Sala não encontrada');
    }

    if (sala.status !== 'ABERTA') {
      throw new BadRequestException(
        'Essa sala não está aberta',
      );
    }

    if (sala._count.jogadores >= sala.maxJogadores) {
      throw new BadRequestException(
        'A sala está cheia',
      );
    }

    const jogadorExistente =
      await this.prisma.jogador.findFirst({
        where: {
          usuarioId,
          salaId: sala.id,
        },
      });

    if (jogadorExistente) {
      return jogadorExistente;
    }

    return await this.prisma.jogador.create({
      data: {
        usuarioId,
        salaId: sala.id,
        eliminado: false,
      },
    });
  }

  async create(
    createSalaDto: CreateSalaDto,
    codigo: string,
    usuarioId: number,
  ) {
    return await this.prisma.sala.create({
      data: {
        ...createSalaDto,
        codigo,
        criadorId: usuarioId,
      },
    });
  }

  async findAll() {
    return await this.prisma.sala.findMany({
      include: {
        _count: {
          select: {
            jogadores: true,
            rodadas: true,
          },
        },
      },
    });
  }

  async findOne(id: number) {
    const sala = await this.prisma.sala.findUnique({
      where: {
        id,
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
                email: true,
              },
            },
          },
        },
        _count: {
          select: {
            jogadores: true,
            rodadas: true,
          },
        },
      },
    });

    if (!sala) {
      throw new NotFoundException('Sala não encontrada');
    }

    return sala;
  }

  async buscarPorCodigo(codigo: string) {
    const sala = await this.prisma.sala.findUnique({
      where: {
        codigo: codigo.toUpperCase(),
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
      throw new NotFoundException('Sala não encontrada');
    }

    return sala;
  }

  async update(id: number, updateSalaDto: UpdateSalaDto) {
    return await this.prisma.sala.update({
      where: {
        id,
      },
      data: updateSalaDto,
    });
  }

  async sairDaSala(codigo: string, usuarioId: number) {
    const sala = await this.prisma.sala.findUnique({
      where: {
        codigo: codigo.toUpperCase(),
      },
    });

    if (!sala) {
      throw new NotFoundException('Sala não encontrada');
    }

    const jogador = await this.prisma.jogador.findFirst({
      where: {
        usuarioId,
        salaId: sala.id,
      },
    });

    if (!jogador) {
      throw new NotFoundException('Você não está nessa sala');
    }

    await this.prisma.jogador.delete({
      where: {
        id: jogador.id,
      },
    });

    return {
      mensagem: 'Você saiu da sala',
    };
  }

  async remove(id: number) {
    return await this.prisma.sala.delete({
      where: {
        id,
      },
    });
  }
}