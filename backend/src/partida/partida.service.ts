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

    // 6. Buscar perguntas disponíveis
    const perguntas = await this.prisma.pergunta.findMany({
      include: {
        alternativas: true,
      },
    });

    if (perguntas.length === 0) {
      throw new BadRequestException(
        'Não existem perguntas cadastradas',
      );
    }

    // 7. Embaralhar as perguntas
    const perguntasEmbaralhadas = [...perguntas].sort(
      () => Math.random() - 0.5,
    );

    // Quantidade de perguntas da partida
    const quantidadePerguntas = Math.min(
      10,
      perguntasEmbaralhadas.length,
    );

    const perguntasSelecionadas =
      perguntasEmbaralhadas.slice(
        0,
        quantidadePerguntas,
      );

    // 8. Criar as rodadas
    const rodadas = await this.prisma.$transaction(
      async (tx) => {
        const rodadasCriadas = [];

        for (
          let i = 0;
          i < perguntasSelecionadas.length;
          i++
        ) {
          const pergunta = perguntasSelecionadas[i];

          const rodada = await tx.rodada.create({
            data: {
              salaId: sala.id,
              perguntaId: pergunta.id,
              ordem: i + 1,
              tempoLimite: 15,
            },
            include: {
              pergunta: {
                include: {
                  alternativas: true,
                },
              },
            },
          });

          rodadasCriadas.push(rodada);
        }

        // 9. Alterar status da sala
        await tx.sala.update({
          where: {
            id: sala.id,
          },
          data: {
            status: 'ANDAMENTO',
          },
        });

        return rodadasCriadas;
      },
    );

    // 10. Retornar resultado
    return {
      mensagem: 'Partida iniciada',
      sala: {
        id: sala.id,
        nome: sala.nome,
        codigo: sala.codigo,
        status: 'ANDAMENTO',
      },
      quantidadeRodadas: rodadas.length,
      rodadas,
    };
  }
}