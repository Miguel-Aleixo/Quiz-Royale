import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
  ConflictException
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

import { CreateUsuarioDto } from './dto/create-usuario.dto';
import { UpdateUsuarioDto } from './dto/update-usuario.dto';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';

@Injectable()
export class UsuarioService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
    private readonly jwtService: JwtService,
  ) { }

  async create(createUsuarioDto: CreateUsuarioDto) {
    const senhaHash = await bcrypt.hash(
      createUsuarioDto.senha,
      10,
    );

    const usuario = await this.prisma.usuario.create({
      data: {
        ...createUsuarioDto,
        senha: senhaHash,
        role: 'JOGADOR',
        emailVerificado: false,
      },
    });

    const token = randomBytes(32).toString('hex');
    const sessaoToken = randomBytes(32).toString('hex');

    const expiraEm = new Date(
      Date.now() + 30 * 60 * 1000,
    );

    await this.prisma.verificacaoEmail.create({
      data: {
        token,
        sessaoToken,
        usuarioId: usuario.id,
        expiraEm,
      },
    });

    try {
      await this.emailService.enviarVerificacaoEmail(
        usuario.email,
        usuario.nome,
        token,
      );
    } catch (error) {
      console.error(
        'Erro ao enviar e-mail de verificação:',
        error,
      );

      await this.prisma.verificacaoEmail.deleteMany({
        where: {
          usuarioId: usuario.id,
        },
      });

      await this.prisma.usuario.delete({
        where: {
          id: usuario.id,
        },
      });

      throw new InternalServerErrorException(
        'Não foi possível enviar o e-mail de verificação.',
      );
    }

    return {
      id: usuario.id,
      nome: usuario.nome,
      email: usuario.email,
      emailVerificado: usuario.emailVerificado,
      sessaoToken,
      mensagem:
        'Cadastro realizado. Verifique seu e-mail para poder jogar.',
    };
  }

  async createAdmin(createUsuarioDto: CreateUsuarioDto) {
    const senhaHash = await bcrypt.hash(
      createUsuarioDto.senha,
      10,
    );

    return await this.prisma.usuario.create({
      data: {
        ...createUsuarioDto,
        senha: senhaHash,
        role: 'ADMIN',
        emailVerificado: true,
      },
    });
  }

  async findAll() {
    return await this.prisma.usuario.findMany({
      include: {
        patente: true,
      },
    });
  }

  async findByEmail(email: string) {
    return await this.prisma.usuario.findFirst({
      where: {
        email,
      },
    });
  }

  async findOne(id: number) {
    const usuario = await this.prisma.usuario.findUnique({
      where: {
        id,
      },
      include: {
        patente: true,
      },
    });

    if (!usuario) {
      throw new NotFoundException(
        'Usuário não encontrado',
      );
    }

    const proximaPatente = usuario.patente
      ? await this.prisma.patente.findFirst({
        where: {
          pontos: {
            gt: usuario.patente.pontos,
          },
        },
        orderBy: {
          pontos: 'asc',
        },
      })
      : await this.prisma.patente.findFirst({
        orderBy: {
          pontos: 'asc',
        },
      });

    let progresso = 0;

    if (proximaPatente && usuario.patente) {
      const pontosIniciais = usuario.patente.pontos;
      const pontosFinais = proximaPatente.pontos;

      progresso =
        ((usuario.pontuacao - pontosIniciais) /
          (pontosFinais - pontosIniciais)) *
        100;

      progresso = Math.max(
        0,
        Math.min(100, progresso),
      );
    } else if (!proximaPatente && usuario.patente) {
      progresso = 100;
    }

    return {
      ...usuario,
      proximaPatente,
      progresso,
    };
  }

  async update(
    id: number,
    updateUsuarioDto: UpdateUsuarioDto,
  ) {
    const usuario = await this.prisma.usuario.findUnique({
      where: {
        id,
      },
    });

    if (!usuario) {
      throw new NotFoundException(
        'Usuário não encontrado.',
      );
    }

    const emailMudou =
      updateUsuarioDto.email !== undefined &&
      updateUsuarioDto.email.toLowerCase() !==
      usuario.email.toLowerCase();

    if (emailMudou) {
      const emailExistente =
        await this.prisma.usuario.findFirst({
          where: {
            email: updateUsuarioDto.email,
            NOT: {
              id,
            },
          },
        });

      if (emailExistente) {
        throw new ConflictException(
          'Este e-mail já está sendo utilizado.',
        );
      }
    }

    const data: {
      nome?: string;
      email?: string;
      senha?: string;
      emailVerificado?: boolean;
    } = {};

    if (updateUsuarioDto.nome !== undefined) {
      data.nome = updateUsuarioDto.nome;
    }

    if (updateUsuarioDto.email !== undefined) {
      data.email =
        updateUsuarioDto.email.toLowerCase();
    }

    if (updateUsuarioDto.senha !== undefined) {
      data.senha = await bcrypt.hash(
        updateUsuarioDto.senha,
        10,
      );
    }

    /*
    
    * Se o e-mail foi alterado,
    * ele volta para "não verificado".
      */
    if (emailMudou) {
      data.emailVerificado = false;
    }

    const usuarioAtualizado =
      await this.prisma.usuario.update({
        where: {
          id,
        },
        data,
        include: {
          patente: true,
        },
      });

    return {
      id: usuarioAtualizado.id,
      nome: usuarioAtualizado.nome,
      email: usuarioAtualizado.email,
      role: usuarioAtualizado.role,
      patenteId: usuarioAtualizado.patenteId,
      pontuacao: usuarioAtualizado.pontuacao,
      emailVerificado:
        usuarioAtualizado.emailVerificado,
      patente: usuarioAtualizado.patente,
      emailAlterado: emailMudou,
    };
  }

  async atualizarPatente(usuarioId: number) {
    const usuario =
      await this.prisma.usuario.findUnique({
        where: {
          id: usuarioId,
        },
        select: {
          id: true,
          pontuacao: true,
          patenteId: true,
        },
      });

    if (!usuario) {
      throw new NotFoundException(
        'Usuário não encontrado',
      );
    }

    const patente =
      await this.prisma.patente.findFirst({
        where: {
          pontos: {
            lte: usuario.pontuacao,
          },
        },
        orderBy: {
          pontos: 'desc',
        },
      });

    if (!patente) {
      return null;
    }

    if (usuario.patenteId !== patente.id) {
      return await this.prisma.usuario.update({
        where: {
          id: usuarioId,
        },
        data: {
          patenteId: patente.id,
        },
        include: {
          patente: true,
        },
      });
    }

    return await this.prisma.usuario.findUnique({
      where: {
        id: usuarioId,
      },
      include: {
        patente: true,
      },
    });
  }

  async verificarEmail(token: string) {
    const verificacao =
      await this.prisma.verificacaoEmail.findUnique({
        where: {
          token,
        },
      });

    if (!verificacao) {
      throw new NotFoundException(
        'Token de verificação inválido.',
      );
    }

    if (verificacao.expiraEm < new Date()) {
      await this.prisma.verificacaoEmail.delete({
        where: {
          id: verificacao.id,
        },
      });

      throw new NotFoundException(
        'O link de verificação expirou.',
      );
    }

    const usuario = await this.prisma.usuario.update({
      where: {
        id: verificacao.usuarioId,
      },
      data: {
        emailVerificado: true,
      },
    });

    console.log(
      'E-MAIL VERIFICADO:',
      usuario.email,
    );

    return {
      mensagem: 'E-mail verificado com sucesso.',
      emailVerificado: true,
    };
  }

  async verificarSessaoEmail(
    sessaoToken: string,
  ) {
    const verificacao =
      await this.prisma.verificacaoEmail.findUnique({
        where: {
          sessaoToken,
        },
        include: {
          usuario: true,
        },
      });

    if (!verificacao) {
      throw new NotFoundException(
        'Sessão de verificação inválida ou já utilizada.',
      );
    }

    if (verificacao.expiraEm < new Date()) {
      await this.prisma.verificacaoEmail.delete({
        where: {
          id: verificacao.id,
        },
      });

      throw new NotFoundException(
        'A sessão de verificação expirou.',
      );
    }

    /*
     * O celular ainda não confirmou o e-mail.
     */
    if (!verificacao.usuario.emailVerificado) {
      return {
        emailVerificado: false,
      };
    }

    /*
     * O e-mail foi confirmado.
     *
     * Agora o PC recebe seu próprio JWT.
     */
    const usuario = verificacao.usuario;

    const payload = {
      sub: usuario.id,
      email: usuario.email,
      patenteId: usuario.patenteId,
      role: usuario.role,
    };

    const accessToken =
      await this.jwtService.signAsync(payload);

    /*
     * A sessão temporária é de uso único.
     */
    await this.prisma.verificacaoEmail.delete({
      where: {
        id: verificacao.id,
      },
    });

    console.log(
      'SESSÃO DE VERIFICAÇÃO CONVERTIDA EM LOGIN:',
      usuario.email,
    );

    return {
      emailVerificado: true,
      accessToken,
      mensagem:
        'E-mail verificado e sessão iniciada.',
    };
  }

  async reenviarVerificacaoPorId(usuarioId: number) {
    const usuario =
      await this.prisma.usuario.findUnique({
        where: {
          id: usuarioId,
        },
      });

    if (!usuario) {
      throw new NotFoundException(
        'Usuário não encontrado.',
      );
    }

    if (usuario.emailVerificado) {
      return {
        mensagem: 'Este e-mail já foi verificado.',
      };
    }

    await this.prisma.verificacaoEmail.deleteMany({
      where: {
        usuarioId: usuario.id,
      },
    });

    const token = randomBytes(32).toString('hex');
    const sessaoToken = randomBytes(32).toString('hex');

    const expiraEm = new Date(
      Date.now() + 30 * 60 * 1000,
    );

    await this.prisma.verificacaoEmail.create({
      data: {
        token,
        sessaoToken,
        usuarioId: usuario.id,
        expiraEm,
      },
    });

    await this.emailService.enviarVerificacaoEmail(
      usuario.email,
      usuario.nome,
      token,
    );

    return {
      mensagem:
        'Um novo e-mail de verificação foi enviado.',
      sessaoToken,
    };
  }

  async solicitarRecuperacaoSenha(email: string) {
    const emailNormalizado = email
      .trim()
      .toLowerCase();

    const usuario =
      await this.prisma.usuario.findUnique({
        where: {
          email: emailNormalizado,
        },
      });

    /*
     * Não informamos se o e-mail existe.
     * Isso evita descoberta de contas cadastradas.
     */
    if (!usuario) {
      return {
        mensagem:
          'Se existir uma conta com este e-mail, enviaremos as instruções para redefinir sua senha.',
      };
    }

    /*
     * Remove solicitações anteriores.
     */
    await this.prisma.recuperacaoSenha.deleteMany({
      where: {
        usuarioId: usuario.id,
      },
    });

    const token = randomBytes(32).toString('hex');

    const expiraEm = new Date(
      Date.now() + 30 * 60 * 1000,
    );

    await this.prisma.recuperacaoSenha.create({
      data: {
        token,
        usuarioId: usuario.id,
        expiraEm,
      },
    });

    try {
      await this.emailService.enviarRecuperacaoSenha(
        usuario.email,
        usuario.nome,
        token,
      );
    } catch (error) {
      console.error(
        'Erro ao enviar recuperação de senha:',
        error,
      );

      await this.prisma.recuperacaoSenha.deleteMany({
        where: {
          usuarioId: usuario.id,
        },
      });

      throw new InternalServerErrorException(
        'Não foi possível enviar o e-mail de recuperação.',
      );
    }

    return {
      mensagem:
        'Se existir uma conta com este e-mail, enviaremos as instruções para redefinir sua senha.',
    };
  }

  async redefinirSenha(
    token: string,
    novaSenha: string,
  ) {
    const recuperacao =
      await this.prisma.recuperacaoSenha.findUnique({
        where: {
          token,
        },
        include: {
          usuario: true,
        },
      });

    if (!recuperacao) {
      throw new NotFoundException(
        'Link de recuperação inválido ou expirado.',
      );
    }

    if (recuperacao.expiraEm < new Date()) {
      await this.prisma.recuperacaoSenha.delete({
        where: {
          id: recuperacao.id,
        },
      });

      throw new NotFoundException(
        'O link de recuperação expirou.',
      );
    }

    const senhaHash = await bcrypt.hash(
      novaSenha,
      10,
    );

    await this.prisma.usuario.update({
      where: {
        id: recuperacao.usuarioId,
      },
      data: {
        senha: senhaHash,
      },
    });

    /*
     * Token de recuperação é de uso único.
     */
    await this.prisma.recuperacaoSenha.delete({
      where: {
        id: recuperacao.id,
      },
    });

    return {
      mensagem:
        'Senha redefinida com sucesso.',
    };
  }

  async obterPartidasRecentes(
    usuarioId: number,
    limite = 5,
  ) {
    const jogadores =
      await this.prisma.jogador.findMany({
        where: {
          usuarioId,
          posicaoFinal: {
            not: null,
          },
          sala: {
            finalizadaEm: {
              not: null,
            },
          },
        },

        orderBy: {
          sala: {
            finalizadaEm: 'desc',
          },
        },

        take: Math.min(Math.max(limite, 1), 20),

        include: {
          sala: {
            select: {
              id: true,
              nome: true,
              codigo: true,
              finalizadaEm: true,

              _count: {
                select: {
                  jogadores: true,
                },
              },
            },
          },

          respostas: {
            include: {
              alternativa: {
                select: {
                  correta: true,
                },
              },
            },
          },
        },
      });

    return jogadores.map((jogador) => {
      const respostas = jogador.respostas;

      const acertos = respostas.filter(
        (resposta) =>
          resposta.alternativa.correta,
      ).length;

      const tempoTotal = respostas.reduce(
        (total, resposta) =>
          total + resposta.tempoResposta,
        0,
      );

      const tempoMedio =
        respostas.length > 0
          ? tempoTotal / respostas.length
          : 0;

      return {
        jogadorId: jogador.id,

        salaId: jogador.sala.id,
        nomeSala: jogador.sala.nome,
        codigoSala: jogador.sala.codigo,

        posicao: jogador.posicaoFinal,

        acertos,
        respostas: respostas.length,

        tempoTotal,
        tempoMedio: Math.round(tempoMedio),

        jogadoresNaPartida:
          jogador.sala._count.jogadores,

        finalizadaEm:
          jogador.sala.finalizadaEm,
      };
    });
  }

  async obterEstatisticas(usuarioId: number) {
    const jogadores = await this.prisma.jogador.findMany({
      where: {
        usuarioId,
        posicaoFinal: {
          not: null,
        },
        sala: {
          finalizadaEm: {
            not: null,
          },
        },
      },
      include: {
        respostas: {
          include: {
            alternativa: {
              select: {
                correta: true,
              },
            },
          },
        },
      },
    });

    const partidasJogadas = jogadores.length;

    const vitorias = jogadores.filter(
      (jogador) => jogador.posicaoFinal === 1,
    ).length;

    const top3 = jogadores.filter(
      (jogador) =>
        jogador.posicaoFinal !== null &&
        jogador.posicaoFinal <= 3,
    ).length;

    let respostasTotais = 0;
    let acertosTotais = 0;
    let tempoTotal = 0;

    for (const jogador of jogadores) {
      for (const resposta of jogador.respostas) {
        respostasTotais++;

        tempoTotal += resposta.tempoResposta;

        if (resposta.alternativa.correta) {
          acertosTotais++;
        }
      }
    }

    const taxaAcerto =
      respostasTotais > 0
        ? (acertosTotais / respostasTotais) * 100
        : 0;

    const tempoMedioResposta =
      respostasTotais > 0
        ? tempoTotal / respostasTotais
        : 0;

    const melhorPosicao =
      jogadores.length > 0
        ? Math.min(
          ...jogadores
            .map((jogador) => jogador.posicaoFinal)
            .filter(
              (posicao): posicao is number =>
                posicao !== null,
            ),
        )
        : null;

    return {
      partidasJogadas,
      vitorias,
      top3,
      acertosTotais,
      respostasTotais,
      taxaAcerto: Number(taxaAcerto.toFixed(1)),
      tempoMedioResposta: Number(
        tempoMedioResposta.toFixed(0),
      ),
      melhorPosicao,
    };
  }

  async remove(id: number) {
    return await this.prisma.usuario.delete({
      where: {
        id,
      },
    });
  }
}

