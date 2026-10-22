
import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { CreatePatenteDto } from './dto/create-patente.dto';
import { UpdatePatenteDto } from './dto/update-patente.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PatenteService {
  constructor(private readonly prisma: PrismaService) {}

  private async validarDuplicidade(
    nome?: string,
    pontos?: number,
    idIgnorado?: number,
  ) {
    const nomeNormalizado = nome?.trim();

    if (nomeNormalizado) {
      const patenteComMesmoNome =
        await this.prisma.patente.findFirst({
          where: {
            nome: {
              equals: nomeNormalizado,
              mode: 'insensitive',
            },
            ...(idIgnorado !== undefined && {
              id: { not: idIgnorado },
            }),
          },
        });

      if (patenteComMesmoNome) {
        throw new ConflictException(
          'Já existe uma patente com esse nome, independentemente de maiúsculas e minúsculas.',
        );
      }
    }

    if (pontos !== undefined) {
      if (!Number.isInteger(pontos) || pontos <= 0) {
        throw new ConflictException(
          'A pontuação deve ser um número inteiro maior que zero.',
        );
      }

      const patenteComMesmosPontos =
        await this.prisma.patente.findFirst({
          where: {
            pontos,
            ...(idIgnorado !== undefined && {
              id: { not: idIgnorado },
            }),
          },
        });

      if (patenteComMesmosPontos) {
        throw new ConflictException(
          'Já existe uma patente com essa quantidade de pontos.',
        );
      }
    }
  }

  async create(createPatenteDto: CreatePatenteDto) {
    const nome = createPatenteDto.nome.trim();

    await this.validarDuplicidade(
      nome,
      createPatenteDto.pontos,
    );

    return this.prisma.patente.create({
      data: {
        ...createPatenteDto,
        nome,
      },
    });
  }

  async findAll() {
    return this.prisma.patente.findMany({
      orderBy: {
        pontos: 'asc',
      },
    });
  }

  async findName(nome: string) {
    return this.prisma.patente.findFirst({
      where: {
        nome: {
          equals: nome.trim(),
          mode: 'insensitive',
        },
      },
    });
  }

  async findOne(id: number) {
    const patente = await this.prisma.patente.findUnique({
      where: { id },
    });

    if (!patente) {
      throw new NotFoundException('Patente não encontrada.');
    }

    return patente;
  }

  async update(
    id: number,
    updatePatenteDto: UpdatePatenteDto,
  ) {
    const patenteAtual = await this.findOne(id);

    const nome =
      updatePatenteDto.nome !== undefined
        ? updatePatenteDto.nome.trim()
        : patenteAtual.nome;

    const pontos =
      updatePatenteDto.pontos !== undefined
        ? updatePatenteDto.pontos
        : patenteAtual.pontos;

    await this.validarDuplicidade(nome, pontos, id);

    return this.prisma.patente.update({
      where: { id },
      data: {
        ...updatePatenteDto,
        ...(updatePatenteDto.nome !== undefined && {
          nome,
        }),
      },
    });
  }

  async remove(id: number) {
    await this.findOne(id);

    const usuarios = await this.prisma.usuario.count({
      where: {
        patenteId: id,
      },
    });

    if (usuarios > 0) {
      throw new ConflictException(
        `Não é possível excluir esta patente. Existem ${usuarios} usuário(s) vinculados a ela.`,
      );
    }

    return this.prisma.patente.delete({
      where: { id },
    });
  }
}
