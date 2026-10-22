import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';

import { CreateTemaDto } from './dto/create-tema.dto';
import { UpdateTemaDto } from './dto/update-tema.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TemaService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Verifica se já existe um tema com o mesmo nome,
   * ignorando diferenças entre maiúsculas e minúsculas.
   */
  private async validarNomeDuplicado(
    nome: string,
    idIgnorado?: number,
  ): Promise<void> {
    const nomeNormalizado = nome.trim();

    const temaExistente = await this.prisma.tema.findFirst({
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

    if (temaExistente) {
      throw new ConflictException(
        'Já existe um tema cadastrado com esse nome!',
      );
    }
  }

  async create(createTemaDto: CreateTemaDto) {
    const nome = createTemaDto.nome?.trim();

    if (!nome) {
      throw new BadRequestException('Nome do tema não pode ser vazio!');
    }

    if (nome.length > 30) {
      throw new BadRequestException(
        'O nome do tema deve ter no máximo 30 caracteres!',
      );
    }

    await this.validarNomeDuplicado(nome);

    return this.prisma.tema.create({
      data: {
        nome,
      },
    });
  }

  async findAll() {
    return this.prisma.tema.findMany({
      orderBy: {
        nome: 'asc',
      },
    });
  }

  async findName(nome: string) {
    return this.prisma.tema.findFirst({
      where: {
        nome: {
          equals: nome.trim(),
          mode: 'insensitive',
        },
      },
    });
  }

  async findOne(id: number) {
    const tema = await this.prisma.tema.findUnique({
      where: { id },
    });

    if (!tema) {
      throw new NotFoundException('Tema não encontrado!');
    }

    return tema;
  }

  async update(id: number, updateTemaDto: UpdateTemaDto) {
    await this.findOne(id);

    const dadosAtualizacao: { nome?: string } = {};

    if (updateTemaDto.nome !== undefined) {
      const nome = updateTemaDto.nome.trim();

      if (!nome) {
        throw new BadRequestException('Nome do tema não pode ser vazio!');
      }

      if (nome.length > 30) {
        throw new BadRequestException(
          'O nome do tema deve ter no máximo 30 caracteres!',
        );
      }

      await this.validarNomeDuplicado(nome, id);

      dadosAtualizacao.nome = nome;
    }

    return this.prisma.tema.update({
      where: { id },
      data: dadosAtualizacao,
    });
  }

  async remove(id: number) {
    await this.findOne(id);

    return this.prisma.tema.delete({
      where: { id },
    });
  }
}