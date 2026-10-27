
import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { CreatePerguntaDto } from './dto/create-pergunta.dto';
import { UpdatePerguntaDto } from './dto/update-pergunta.dto';

type UserRole = 'ADMIN' | 'JOGADOR';

@Injectable()
export class PerguntaService {
  constructor(private readonly prisma: PrismaService) { }

  async create(dto: CreatePerguntaDto, usuarioId: number) {
    return this.prisma.pergunta.create({
      data: {
        enunciado: dto.enunciado,
        temaId: dto.temaId,
        criadorId: usuarioId,
      },
      include: {
        tema: true,
        alternativas: true,
      },
    });
  }

  async findAll() {
    return this.prisma.pergunta.findMany({
      include: {
        alternativas: true,
        tema: true,
        criador: {
          select: {
            id: true,
            nome: true,
            role: true,
          },
        },
        _count: {
          select: {
            rodadas: true,
          },
        },
      },
      orderBy: {
        id: 'desc',
      },
    });
  }

  async findOne(id: number) {
    const pergunta = await this.prisma.pergunta.findUnique({
      where: { id },
      include: {
        alternativas: true,
        tema: true,
      },
    });

    if (!pergunta) {
      throw new NotFoundException('Pergunta não encontrada.');
    }

    return pergunta;
  }

  async update(
    id: number,
    dto: UpdatePerguntaDto,
    usuarioId: number,
    role: UserRole,
  ) {
    const pergunta = await this.prisma.pergunta.findUnique({
      where: { id },
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

    const isAdmin = role === 'ADMIN';
    const isCreator = pergunta.criadorId === usuarioId;

    if (!isAdmin && !isCreator) {
      throw new ForbiddenException(
        'Você só pode editar suas próprias perguntas.',
      );
    }

    if (pergunta._count.rodadas > 0) {
      throw new ConflictException(
        'Essa pergunta já foi utilizada em uma rodada e não pode ser editada. Crie uma nova pergunta para preservar as partidas.',
      );
    }

    return this.prisma.pergunta.update({
      where: { id },
      data: {
        ...(dto.enunciado !== undefined && {
          enunciado: dto.enunciado,
        }),
        ...(dto.temaId !== undefined && {
          temaId: dto.temaId,
        }),
      },
      include: {
        tema: true,
        alternativas: true,
      },
    });
  }

  async remove(
    id: number,
    usuarioId: number,
    role: UserRole,
  ) {
    const pergunta = await this.prisma.pergunta.findUnique({
      where: { id },
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

    const isAdmin = role === 'ADMIN';
    const isCreator = pergunta.criadorId === usuarioId;

    if (!isAdmin && !isCreator) {
      throw new ForbiddenException(
        'Você só pode excluir suas próprias perguntas.',
      );
    }

    if (pergunta._count.rodadas > 0) {
      throw new ConflictException(
        'Essa pergunta está vinculada a uma ou mais rodadas e não pode ser excluída.',
      );
    }

    return this.prisma.$transaction(async (tx) => {
      const alternativas = await tx.alternativa.findMany({
        where: { perguntaId: id },
        select: { id: true },
      });

      const alternativaIds = alternativas.map((item) => item.id);

      // Evita deixar respostas órfãs, caso existam registros antigos.
      const respostas = await tx.resposta.count({
        where: {
          alternativaId: { in: alternativaIds },
        },
      });

      if (respostas > 0) {
        throw new ConflictException(
          'Não é possível excluir essa pergunta porque existem respostas vinculadas às suas alternativas.',
        );
      }

      await tx.alternativa.deleteMany({
        where: { perguntaId: id },
      });

      return tx.pergunta.delete({
        where: { id },
      });
    });
  }
}
