
import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { CreateAlternativaDto } from './dto/create-alternativa.dto';
import { UpdateAlternativaDto } from './dto/update-alternativa.dto';

type UserRole = 'ADMIN' | 'JOGADOR';

@Injectable()
export class AlternativaService {
  constructor(private readonly prisma: PrismaService) {}

  private async validarPermissaoPergunta(
    perguntaId: number,
    usuarioId: number,
    role: UserRole,
  ) {
    const pergunta = await this.prisma.pergunta.findUnique({
      where: { id: perguntaId },
      include: {
        _count: {
          select: {
            rodadas: true,
          },
        },
      },
    });

    if (!pergunta) {
      throw new NotFoundException('Pergunta não encontrada.');
    }

    if (
      role !== 'ADMIN' &&
      pergunta.criadorId !== usuarioId
    ) {
      throw new ForbiddenException(
        'Você só pode gerenciar alternativas das suas próprias perguntas.',
      );
    }

    if (pergunta._count.rodadas > 0) {
      throw new ConflictException(
        'Não é possível alterar alternativas de uma pergunta utilizada em rodadas.',
      );
    }

    return pergunta;
  }

  async create(
    dto: CreateAlternativaDto,
    usuarioId: number,
    role: UserRole,
  ) {
    await this.validarPermissaoPergunta(
      dto.perguntaId,
      usuarioId,
      role,
    );

    return this.prisma.alternativa.create({
      data: {
        perguntaId: dto.perguntaId,
        texto: dto.texto,
        correta: dto.correta,
      },
    });
  }

  async findAll() {
    return this.prisma.alternativa.findMany({
      orderBy: {
        id: 'asc',
      },
    });
  }

  async findOne(id: number) {
    const alternativa = await this.prisma.alternativa.findUnique({
      where: { id },
    });

    if (!alternativa) {
      throw new NotFoundException('Alternativa não encontrada.');
    }

    return alternativa;
  }

  async update(
    id: number,
    dto: UpdateAlternativaDto,
    usuarioId: number,
    role: UserRole,
  ) {
    const alternativa = await this.prisma.alternativa.findUnique({
      where: { id },
    });

    if (!alternativa) {
      throw new NotFoundException('Alternativa não encontrada.');
    }

    // Não permite mover uma alternativa para outra pergunta.
    if (
      dto.perguntaId !== undefined &&
      dto.perguntaId !== alternativa.perguntaId
    ) {
      throw new ConflictException(
        'Não é permitido transferir uma alternativa para outra pergunta.',
      );
    }

    await this.validarPermissaoPergunta(
      alternativa.perguntaId,
      usuarioId,
      role,
    );

    return this.prisma.alternativa.update({
      where: { id },
      data: {
        ...(dto.texto !== undefined && {
          texto: dto.texto,
        }),
        ...(dto.correta !== undefined && {
          correta: dto.correta,
        }),
      },
    });
  }

  async remove(
    id: number,
    usuarioId: number,
    role: UserRole,
  ) {
    const alternativa = await this.prisma.alternativa.findUnique({
      where: { id },
    });

    if (!alternativa) {
      throw new NotFoundException('Alternativa não encontrada.');
    }

    await this.validarPermissaoPergunta(
      alternativa.perguntaId,
      usuarioId,
      role,
    );

    const respostas = await this.prisma.resposta.count({
      where: {
        alternativaId: id,
      },
    });

    if (respostas > 0) {
      throw new ConflictException(
        'Não é possível excluir uma alternativa que já possui respostas registradas.',
      );
    }

    return this.prisma.alternativa.delete({
      where: { id },
    });
  }
}
