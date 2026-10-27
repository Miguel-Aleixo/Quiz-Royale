
import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { CreateRodadaDto } from './dto/create-rodada.dto';
import { UpdateRodadaDto } from './dto/update-rodada.dto';

type UserRole = 'ADMIN' | 'JOGADOR';

@Injectable()
export class RodadaService {
  constructor(private readonly prisma: PrismaService) {}

  private async validarPermissaoSala(
    salaId: number,
    usuarioId: number,
    role: UserRole,
  ) {
    const sala = await this.prisma.sala.findUnique({
      where: { id: salaId },
    });

    if (!sala) {
      throw new NotFoundException('Sala não encontrada.');
    }

    if (role !== 'ADMIN' && sala.criadorId !== usuarioId) {
      throw new ForbiddenException(
        'Somente o criador da sala ou um administrador pode gerenciar suas rodadas.',
      );
    }

    if (sala.status !== 'ABERTA') {
      throw new ConflictException(
        'Não é possível modificar rodadas de uma sala que não esteja aberta.',
      );
    }

    return sala;
  }

  private async validarPergunta(perguntaId: number) {
    const pergunta = await this.prisma.pergunta.findUnique({
      where: { id: perguntaId },
      include: {
        alternativas: true,
      },
    });

    if (!pergunta) {
      throw new NotFoundException('Pergunta não encontrada.');
    }

    if (pergunta.alternativas.length < 2) {
      throw new BadRequestException(
        'A pergunta precisa ter pelo menos duas alternativas.',
      );
    }

    if (!pergunta.alternativas.some((alternativa) => alternativa.correta)) {
      throw new BadRequestException(
        'A pergunta precisa ter pelo menos uma alternativa correta.',
      );
    }

    return pergunta;
  }

  async create(
    dto: CreateRodadaDto,
    usuarioId: number,
    role: UserRole,
  ) {
    await this.validarPermissaoSala(
      dto.salaId,
      usuarioId,
      role,
    );

    await this.validarPergunta(dto.perguntaId);

    return this.prisma.rodada.create({
      data: {
        perguntaId: dto.perguntaId,
        salaId: dto.salaId,
        tempoLimite: dto.tempoLimite,
        ...(dto.ordem !== undefined && {
          ordem: dto.ordem,
        }),
      },
      include: {
        pergunta: {
          include: {
            alternativas: true,
            tema: true,
          },
        },
        sala: true,
      },
    });
  }

  async findAll() {
    return this.prisma.rodada.findMany({
      include: {
        pergunta: {
          include: {
            alternativas: true,
            tema: true,
          },
        },
        sala: true,
      },
      orderBy: [
        { salaId: 'asc' },
        { ordem: 'asc' },
        { id: 'asc' },
      ],
    });
  }

  async findOne(id: number) {
    const rodada = await this.prisma.rodada.findUnique({
      where: { id },
      include: {
        pergunta: {
          include: {
            alternativas: true,
            tema: true,
          },
        },
        sala: true,
      },
    });

    if (!rodada) {
      throw new NotFoundException('Rodada não encontrada.');
    }

    return rodada;
  }

  async update(
    id: number,
    dto: UpdateRodadaDto,
    usuarioId: number,
    role: UserRole,
  ) {
    const rodada = await this.prisma.rodada.findUnique({
      where: { id },
    });

    if (!rodada) {
      throw new NotFoundException('Rodada não encontrada.');
    }

    await this.validarPermissaoSala(
      rodada.salaId,
      usuarioId,
      role,
    );

    // Não permite mover uma rodada para outra sala por meio de PATCH.
    if (
      dto.salaId !== undefined &&
      dto.salaId !== rodada.salaId
    ) {
      throw new ConflictException(
        'Não é permitido transferir uma rodada para outra sala.',
      );
    }

    if (dto.perguntaId !== undefined) {
      await this.validarPergunta(dto.perguntaId);
    }

    return this.prisma.rodada.update({
      where: { id },
      data: {
        ...(dto.perguntaId !== undefined && {
          perguntaId: dto.perguntaId,
        }),
        ...(dto.tempoLimite !== undefined && {
          tempoLimite: dto.tempoLimite,
        }),
        ...(dto.ordem !== undefined && {
          ordem: dto.ordem,
        }),
      },
      include: {
        pergunta: {
          include: {
            alternativas: true,
            tema: true,
          },
        },
        sala: true,
      },
    });
  }

  async remove(
    id: number,
    usuarioId: number,
    role: UserRole,
  ) {
    const rodada = await this.prisma.rodada.findUnique({
      where: { id },
    });

    if (!rodada) {
      throw new NotFoundException('Rodada não encontrada.');
    }

    await this.validarPermissaoSala(
      rodada.salaId,
      usuarioId,
      role,
    );

    return this.prisma.rodada.delete({
      where: { id },
    });
  }
}
