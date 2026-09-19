import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { SalaGateway } from '../sala/sala.gateway';

@Injectable()
export class PartidaService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly salaGateway: SalaGateway,
  ) {}

  async iniciar(codigo: string, usuarioId: number) {
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

    /*
     * =========================================================
     * SALA NÃO ENCONTRADA
     * =========================================================
     */

    if (!sala) {
      throw new NotFoundException(
        'Sala não encontrada',
      );
    }

    /*
     * =========================================================
     * VERIFICAR CRIADOR
     * =========================================================
     */

    if (sala.criadorId !== usuarioId) {
      throw new BadRequestException(
        'Apenas o criador da sala pode iniciar a partida',
      );
    }

    /*
     * =========================================================
     * VERIFICAR STATUS
     * =========================================================
     */

    if (sala.status !== 'ABERTA') {
      throw new BadRequestException(
        'Essa sala não está disponível para iniciar',
      );
    }

    /*
     * =========================================================
     * VERIFICAR JOGADORES
     * =========================================================
     */

    if (sala.jogadores.length === 0) {
      throw new BadRequestException(
        'É necessário ter pelo menos um jogador na sala',
      );
    }

    /*
     * =========================================================
     * VERIFICAR RODADAS
     * =========================================================
     */

    if (sala.rodadas.length === 0) {
      throw new BadRequestException(
        'Essa sala não possui perguntas cadastradas',
      );
    }

    /*
     * =========================================================
     * ALTERAR STATUS
     * =========================================================
     */

    const salaAtualizada =
      await this.prisma.sala.update({
        where: {
          id: sala.id,
        },

        data: {
          status: 'ANDAMENTO',
        },
      });

    /*
     * =========================================================
     * AVISAR OS JOGADORES
     * =========================================================
     *
     * O SalaGateway envia um evento para todos os
     * jogadores que estão conectados nessa sala.
     *
     * Evento:
     *
     * partida_iniciada
     *
     * O frontend recebe esse evento e manda
     * todos para /partida.
     */

    this.salaGateway.avisarPartidaIniciada(
      salaAtualizada.codigo,
    );

    /*
     * =========================================================
     * RETORNO
     * =========================================================
     */

    return {
      mensagem: 'Partida iniciada',

      sala: {
        id: salaAtualizada.id,
        nome: salaAtualizada.nome,
        codigo: salaAtualizada.codigo,
        status: salaAtualizada.status,
      },

      quantidadeRodadas:
        sala.rodadas.length,

      rodadas: sala.rodadas,
    };
  }
}