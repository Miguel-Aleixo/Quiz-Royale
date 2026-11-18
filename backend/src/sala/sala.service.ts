import { Injectable } from '@nestjs/common';
import { CreateSalaDto } from './dto/create-sala.dto';
import { UpdateSalaDto } from './dto/update-sala.dto';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateSalaEdicaoDto } from './dto/update-sala-edicao.dto';
import {
  BadRequestException,
  NotFoundException,
  ForbiddenException,
  ConflictException
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
      where: {
        arquivada: false,
      },
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

  async findArquivadas() {
    return this.prisma.sala.findMany({
      where: {
        arquivada: true,
      },
      include: {
        _count: {
          select: {
            jogadores: true,
            rodadas: true,
          },
        },
      },
      orderBy: {
        arquivadaEm: 'desc',
      },
    });
  }

  async arquivar(
    id: number,
    usuarioId: number,
    role: 'ADMIN' | 'JOGADOR',
  ) {
    const sala = await this.prisma.sala.findUnique({
      where: { id },
    });

    if (!sala) {
      throw new NotFoundException('Sala não encontrada.');
    }

    if (role !== 'ADMIN' && sala.criadorId !== usuarioId) {
      throw new ForbiddenException(
        'Somente o criador da sala ou um administrador pode arquivá-la.',
      );
    }

    if (sala.arquivada) {
      throw new ConflictException('Essa sala já está arquivada.');
    }

    if (
      sala.status === 'ABERTA' ||
      sala.status === 'EM_ANDAMENTO'
    ) {
      throw new ConflictException(
        'Feche ou finalize a sala antes de arquivá-la.',
      );
    }

    return this.prisma.sala.update({
      where: { id },
      data: {
        arquivada: true,
        arquivadaEm: new Date(),
      },
    });
  }


  async buscarParaEdicao(
    id: number,
    usuarioId: number,
    role: 'ADMIN' | 'JOGADOR',
  ) {
    const sala = await this.prisma.sala.findUnique({
      where: { id },
      include: {
        rodadas: {
          orderBy: {
            ordem: 'asc',
          },
          include: {
            pergunta: {
              include: {
                tema: true,
                criador: {
                  select: {
                    id: true,
                    nome: true,
                    role: true,
                  },
                },
                alternativas: {
                  select: {
                    id: true,
                    texto: true,
                    correta: true,
                  },
                },
              },
            },
          },
        },
        _count: {
          select: {
            jogadores: true,
          },
        },
      },
    });

    if (!sala) {
      throw new NotFoundException('Sala não encontrada.');
    }

    if (role !== 'ADMIN' && sala.criadorId !== usuarioId) {
      throw new ForbiddenException(
        'Somente o criador da sala ou um administrador pode editá-la.',
      );
    }

    if (sala.status !== 'ABERTA' || sala.arquivada) {
      throw new ConflictException(
        'Somente salas abertas e não arquivadas podem ser editadas.',
      );
    }

    const respostas = await this.prisma.resposta.count({
      where: {
        jogador: {
          salaId: id,
        },
      },
    });

    if (respostas > 0) {
      throw new ConflictException(
        'Não é possível editar uma sala que já possui respostas registradas.',
      );
    }

    return sala;
  }

  async atualizarEdicao(
    id: number,
    dto: UpdateSalaEdicaoDto,
    usuarioId: number,
    role: 'ADMIN' | 'JOGADOR',
  ) {
    const sala = await this.prisma.sala.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            jogadores: true,
          },
        },
      },
    });

    if (!sala) {
      throw new NotFoundException('Sala não encontrada.');
    }

    if (role !== 'ADMIN' && sala.criadorId !== usuarioId) {
      throw new ForbiddenException(
        'Somente o criador da sala ou um administrador pode editá-la.',
      );
    }

    if (sala.status !== 'ABERTA' || sala.arquivada) {
      throw new ConflictException(
        'Somente salas abertas e não arquivadas podem ser editadas.',
      );
    }

    if (
      !dto.nome?.trim() ||
      dto.maxJogadores < 2 ||
      dto.maxJogadores > 50
    ) {
      throw new BadRequestException(
        'Informe um nome válido e uma capacidade entre 2 e 50 jogadores.',
      );
    }

    if (dto.maxJogadores < sala._count.jogadores) {
      throw new ConflictException(
        'O limite não pode ser menor que a quantidade atual de jogadores.',
      );
    }

    if (
      !Array.isArray(dto.perguntasBanco) ||
      !Array.isArray(dto.perguntasProprias)
    ) {
      throw new BadRequestException(
        'A configuração das perguntas está inválida.',
      );
    }

    if (
      dto.perguntasBanco.length + dto.perguntasProprias.length === 0
    ) {
      throw new BadRequestException(
        'Adicione pelo menos uma pergunta à sala.',
      );
    }

    // Verifica se já existem respostas antes de modificar as rodadas.
    const respostas = await this.prisma.resposta.count({
      where: {
        jogador: {
          salaId: id,
        },
      },
    });

    if (respostas > 0) {
      throw new ConflictException(
        'Não é possível editar uma sala que já possui respostas registradas.',
      );
    }

    // Valida as perguntas do banco.
    const idsBanco = dto.perguntasBanco.map(
      (item) => item.perguntaId,
    );

    if (new Set(idsBanco).size !== idsBanco.length) {
      throw new BadRequestException(
        'Existem perguntas repetidas na seleção.',
      );
    }

    for (const item of dto.perguntasBanco) {
      if (
        !Number.isInteger(item.tempoLimite) ||
        item.tempoLimite < 10 ||
        item.tempoLimite > 120
      ) {
        throw new BadRequestException(
          'O tempo das perguntas deve estar entre 10 e 120 segundos.',
        );
      }
    }

    if (idsBanco.length > 0) {
      const perguntasOficiais = await this.prisma.pergunta.findMany({
        where: {
          id: { in: idsBanco },
          criador: {
            role: 'ADMIN',
          },
        },
        select: {
          id: true,
          alternativas: {
            select: {
              texto: true,
              correta: true,
            },
          },
        },
      });

      if (perguntasOficiais.length !== idsBanco.length) {
        throw new BadRequestException(
          'Uma ou mais perguntas selecionadas não pertencem ao banco oficial.',
        );
      }

      for (const pergunta of perguntasOficiais) {
        if (
          pergunta.alternativas.length < 2 ||
          !pergunta.alternativas.some((a) => a.correta) ||
          pergunta.alternativas.some((a) => !a.texto.trim())
        ) {
          throw new BadRequestException(
            `A pergunta ${pergunta.id} possui alternativas inválidas.`,
          );
        }
      }
    }

    // Valida as perguntas próprias antes de iniciar a transação.
    for (let i = 0; i < dto.perguntasProprias.length; i++) {
      const pergunta = dto.perguntasProprias[i];

      if (
        !pergunta.enunciado?.trim() ||
        !Number.isInteger(pergunta.temaId) ||
        !Number.isInteger(pergunta.tempoLimite) ||
        pergunta.tempoLimite < 10 ||
        pergunta.tempoLimite > 120
      ) {
        throw new BadRequestException(
          `A pergunta própria ${i + 1} possui dados inválidos.`,
        );
      }

      if (
        !Array.isArray(pergunta.alternativas) ||
        pergunta.alternativas.length < 2
      ) {
        throw new BadRequestException(
          `A pergunta própria ${i + 1} precisa ter pelo menos duas alternativas.`,
        );
      }

      const alternativasCorretas = pergunta.alternativas.filter(
        (a) => a.correta === true,
      ).length;

      if (alternativasCorretas !== 1) {
        throw new BadRequestException(
          `A pergunta própria ${i + 1} precisa ter exatamente uma alternativa correta.`,
        );
      }

      if (
        pergunta.alternativas.some(
          (a) => !a.texto?.trim() || typeof a.correta !== 'boolean',
        )
      ) {
        throw new BadRequestException(
          `A pergunta própria ${i + 1} possui alternativas inválidas.`,
        );
      }
    }

    // Confere se todos os temas existem.
    const temasIds = [
      ...new Set(dto.perguntasProprias.map((p) => p.temaId)),
    ];

    if (temasIds.length > 0) {
      const temas = await this.prisma.tema.count({
        where: {
          id: { in: temasIds },
        },
      });

      if (temas !== temasIds.length) {
        throw new BadRequestException(
          'Um ou mais temas selecionados não existem.',
        );
      }
    }

    // Atualiza tudo em uma única transação.
    await this.prisma.$transaction(async (tx) => {
      // Remove somente as rodadas antigas.
      // As perguntas e alternativas antigas permanecem preservadas.
      await tx.rodada.deleteMany({
        where: {
          salaId: id,
        },
      });

      // Atualiza os dados principais da sala.
      await tx.sala.update({
        where: { id },
        data: {
          nome: dto.nome.trim(),
          maxJogadores: dto.maxJogadores,
        },
      });

      let ordem = 1;

      // Primeiro entram as perguntas oficiais.
      for (const item of dto.perguntasBanco) {
        await tx.rodada.create({
          data: {
            salaId: id,
            perguntaId: item.perguntaId,
            ordem,
            tempoLimite: item.tempoLimite,
          },
        });

        ordem++;
      }

      // Depois são criadas as perguntas próprias.
      for (const pergunta of dto.perguntasProprias) {
        const perguntaCriada = await tx.pergunta.create({
          data: {
            enunciado: pergunta.enunciado.trim(),
            temaId: pergunta.temaId,
            criadorId: usuarioId,
            alternativas: {
              create: pergunta.alternativas.map((alternativa) => ({
                texto: alternativa.texto.trim(),
                correta: alternativa.correta,
              })),
            },
          },
        });

        await tx.rodada.create({
          data: {
            salaId: id,
            perguntaId: perguntaCriada.id,
            ordem,
            tempoLimite: pergunta.tempoLimite,
          },
        });

        ordem++;
      }
    });

    return this.prisma.sala.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            jogadores: true,
            rodadas: true,
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
              },
            },
          },
        },
      },
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

  async update(
    id: number,
    updateSalaDto: UpdateSalaDto,
    usuarioId: number,
    role: 'ADMIN' | 'JOGADOR',
  ) {
    const sala = await this.prisma.sala.findUnique({
      where: { id },
    });

    if (!sala) {
      throw new NotFoundException('Sala não encontrada.');
    }

    if (role !== 'ADMIN' && sala.criadorId !== usuarioId) {
      throw new ForbiddenException(
        'Somente o criador da sala ou um administrador pode editá-la.',
      );
    }

    if (sala.status !== 'ABERTA') {
      throw new ConflictException(
        'Só é possível editar uma sala aberta.',
      );
    }

    // Não permita alterar código, criador ou status por este endpoint.
    const dadosPermitidos = {
      ...(updateSalaDto.nome !== undefined && {
        nome: updateSalaDto.nome,
      }),
      ...(updateSalaDto.maxJogadores !== undefined && {
        maxJogadores: updateSalaDto.maxJogadores,
      }),
    };

    if (
      dadosPermitidos.maxJogadores !== undefined &&
      (
        dadosPermitidos.maxJogadores < 2 ||
        dadosPermitidos.maxJogadores > 50
      )
    ) {
      throw new BadRequestException(
        'O limite de jogadores deve estar entre 2 e 50.',
      );
    }

    if (dadosPermitidos.maxJogadores !== undefined) {
      const quantidadeJogadores = await this.prisma.jogador.count({
        where: { salaId: id },
      });

      if (dadosPermitidos.maxJogadores < quantidadeJogadores) {
        throw new ConflictException(
          'O limite não pode ser menor que a quantidade atual de jogadores.',
        );
      }
    }

    return this.prisma.sala.update({
      where: { id },
      data: dadosPermitidos,
    });
  }

  async remove(
    id: number,
    usuarioId: number,
    role: 'ADMIN' | 'JOGADOR',
  ) {
    const sala = await this.prisma.sala.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            jogadores: true,
            rodadas: true,
          },
        },
      },
    });

    if (!sala) {
      throw new NotFoundException('Sala não encontrada.');
    }

    if (role !== 'ADMIN' && sala.criadorId !== usuarioId) {
      throw new ForbiddenException(
        'Somente o criador da sala ou um administrador pode excluí-la.',
      );
    }

    if (sala._count.jogadores > 0 || sala._count.rodadas > 0) {
      throw new ConflictException(
        'Não é possível excluir uma sala que possui jogadores ou rodadas. Feche-a ou utilize um fluxo de arquivamento.',
      );
    }

    return this.prisma.sala.delete({
      where: { id },
    });
  }
}
