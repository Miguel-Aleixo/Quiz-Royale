import { Injectable } from '@nestjs/common';
import { CreateSalaDto } from './dto/create-sala.dto';
import { UpdateSalaDto } from './dto/update-sala.dto';
import { PrismaService } from '../prisma/prisma.service';
import {
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { SalaGateway } from './sala.gateway';

@Injectable()
export class SalaService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly salaGateway: SalaGateway
  ) { }

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

        rodadas: {
          orderBy: {
            ordem: 'asc',
          },

          include: {
            pergunta: {
              select: {
                id: true,
                enunciado: true,

                alternativas: {
                  select: {
                    id: true,
                    texto: true,
                  },
                },
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

    // Se o criador sair, fecha a sala
    if (sala.criadorId === usuarioId) {
      await this.prisma.$transaction([
        this.prisma.jogador.deleteMany({
          where: {
            salaId: sala.id,
          },
        }),

        this.prisma.sala.update({
          where: {
            id: sala.id,
          },
          data: {
            status: 'FECHADA',
          },
        }),
      ]);

      return {
        mensagem: 'Você saiu e a sala foi fechada',
        salaFechada: true,
      };
    }

    // Jogador normal apenas sai
    await this.prisma.jogador.delete({
      where: {
        id: jogador.id,
      },
    });

    return {
      mensagem: 'Você saiu da sala',
      salaFechada: false,
    };
  }

  private gerarCodigo(): string {
    const caracteres =
      'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

    let codigo = '';

    for (let i = 0; i < 6; i++) {
      codigo += caracteres.charAt(
        Math.floor(
          Math.random() * caracteres.length,
        ),
      );
    }

    return codigo;
  }

  async reabrir(
    salaId: number,
    usuarioId: number,
  ) {
    const sala = await this.prisma.sala.findUnique({
      where: {
        id: salaId,
      },
    });

    if (!sala) {
      throw new NotFoundException(
        'Sala não encontrada',
      );
    }

    /*
     * Somente o criador original
     * pode reabrir a sala.
     */
    if (sala.criadorId !== usuarioId) {
      throw new BadRequestException(
        'Apenas o criador da sala pode reabri-la',
      );
    }

    /*
     * A sala já está aberta.
     */
    if (sala.status === 'ABERTA') {
      throw new BadRequestException(
        'Essa sala já está aberta',
      );
    }

    /*
     * Gerar um novo código.
     */
    let novoCodigo = this.gerarCodigo();

    let codigoExistente =
      await this.prisma.sala.findUnique({
        where: {
          codigo: novoCodigo,
        },
      });

    /*
     * Garante que o novo código não
     * seja igual ao de outra sala.
     */
    while (codigoExistente) {
      novoCodigo = this.gerarCodigo();

      codigoExistente =
        await this.prisma.sala.findUnique({
          where: {
            codigo: novoCodigo,
          },
        });
    }

    /*
     * Buscar as rodadas atuais da sala.
     *
     * As perguntas continuam sendo as mesmas,
     * mas a ordem será embaralhada.
     */
    const rodadas =
      await this.prisma.rodada.findMany({
        where: {
          salaId,
        },
        orderBy: {
          ordem: 'asc',
        },
        select: {
          id: true,
        },
      });

    /*
     * Fisher-Yates Shuffle
     *
     * Embaralha as rodadas de forma aleatória.
     */
    for (let i = rodadas.length - 1; i > 0; i--) {
      const j = Math.floor(
        Math.random() * (i + 1),
      );

      [rodadas[i], rodadas[j]] = [
        rodadas[j],
        rodadas[i],
      ];
    }

    /*
     * Todas as operações precisam acontecer
     * juntas para evitar que a sala fique em
     * um estado intermediário.
     */
    await this.prisma.$transaction(async (tx) => {
      /*
       * As respostas dependem dos jogadores.
       *
       * Primeiro removemos as respostas.
       */
      await tx.resposta.deleteMany({
        where: {
          jogador: {
            salaId,
          },
        },
      });

      /*
       * Depois removemos os jogadores da partida anterior.
       */
      await tx.jogador.deleteMany({
        where: {
          salaId,
        },
      });

      /*
       * Se existir alguma restrição de unicidade
       * na ordem das rodadas, primeiro colocamos
       * valores temporários negativos.
       */
      for (let i = 0; i < rodadas.length; i++) {
        await tx.rodada.update({
          where: {
            id: rodadas[i].id,
          },
          data: {
            ordem: -(i + 1),
          },
        });
      }

      /*
       * Agora aplicamos a nova ordem aleatória.
       */
      for (let i = 0; i < rodadas.length; i++) {
        await tx.rodada.update({
          where: {
            id: rodadas[i].id,
          },
          data: {
            ordem: i + 1,
          },
        });
      }

      /*
       * Reabre a sala com um novo código.
       */
      await tx.sala.update({
        where: {
          id: salaId,
        },
        data: {
          codigo: novoCodigo,
          status: 'ABERTA',
          criadorId: usuarioId,
        },
      });
    });

    /*
     * Buscar a sala novamente para retornar
     * os dados completos.
     */
    return await this.prisma.sala.findUnique({
      where: {
        id: salaId,
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

        rodadas: {
          orderBy: {
            ordem: 'asc',
          },
          include: {
            pergunta: {
              select: {
                id: true,
                enunciado: true,
                alternativas: {
                  select: {
                    id: true,
                    texto: true,
                  },
                },
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
  }

  async remove(id: number) {
    return await this.prisma.sala.delete({
      where: {
        id,
      },
    });
  }
}