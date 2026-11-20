import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
  ConflictException,
  BadRequestException,
  ForbiddenException
} from '@nestjs/common';

// SEGURANÇA
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto'; 
import { Role } from '@prisma/client';

// SERVICE 
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';

// DTO
import { CreateUsuarioDto } from './dto/create-usuario.dto';
import { UpdateUsuarioDto } from './dto/update-usuario.dto';

@Injectable()
export class UsuarioService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
    private readonly jwtService: JwtService,
  ) { }

  // CRIAR USUÁRIO
  async create(createUsuarioDto: CreateUsuarioDto) {
    const senhaHash = await bcrypt.hash(
      createUsuarioDto.senha,
      10,
    );

    const usuario = await this.prisma.usuario.create({
      data: {
        ...createUsuarioDto,
        nome: createUsuarioDto.nome.trim().toLowerCase(),
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

  // CRIAR ADMIN
  async createAdmin(createUsuarioDto: CreateUsuarioDto) {
    const senhaHash = await bcrypt.hash(
      createUsuarioDto.senha,
      10,
    );

    return await this.prisma.usuario.create({
      data: {
        ...createUsuarioDto,
        nome: createUsuarioDto.nome.trim().toLowerCase(),
        senha: senhaHash,
        role: 'ADMIN',
        emailVerificado: true,
      },
    });
  }

  // BUSCAR USUÁRIOS
  async findAll() {
    return await this.prisma.usuario.findMany({
      include: {
        patente: true,
      },
    });
  }

  // BUSCAR USUÁRIO POR EMAILL
  async findByEmail(email: string) {
    return await this.prisma.usuario.findFirst({
      where: {
        email,
      },
    });
  }

  // BUSCAR USUÁRIO POR EMAIL OU NOME DE USUÁRIO
  async findByEmailOuUsuario(identificador: string) {
    return this.prisma.usuario.findFirst({
      where: {
        OR: [
          {
            email: identificador,
          },
          {
            nome: identificador,
          },
        ],
      },
    });
  }

  // BUSCAR USUÁRIO
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

  // MUDAR PERMISSÕES
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


  // VERIFICAÇÃO DE EMAIL
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

  // VERIFICAÇÃO DE SESSÃO
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

    if (!verificacao.usuario.emailVerificado) {
      return {
        emailVerificado: false,
      };
    }

    const usuario = verificacao.usuario;

    const payload = {
      sub: usuario.id,
      email: usuario.email,
      patenteId: usuario.patenteId,
      role: usuario.role,
    };

    const accessToken =
      await this.jwtService.signAsync(payload);

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

  // REENVIAR VERIFICAÇÃO DE EMAIL
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

    if (!usuario) {
      return {
        mensagem:
          'Se existir uma conta com este e-mail, enviaremos as instruções para redefinir sua senha.',
      };
    }

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

  // RECUPERAR SENHA
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

  // BUSCAR PARTIDAS JOGADAS RECENTEMENTE
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

  // BUSCAR ESTATISTICAS
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

  // ALTERAR PERMISSÕES
  async alterarRole(
    id: number,
    novaRole: Role,
    solicitanteId: number,
  ) {
    if (!Number.isInteger(id) || id <= 0) {
      throw new BadRequestException('ID de usuário inválido.');
    }

    if (id === solicitanteId) {
      throw new ForbiddenException(
        'Você não pode alterar sua própria função.',
      );
    }

    const usuario = await this.prisma.usuario.findUnique({
      where: { id },
      select: {
        id: true,
        nome: true,
        email: true,
        role: true,
      },
    });

    if (!usuario) {
      throw new NotFoundException('Usuário não encontrado.');
    }

    if (usuario.role === novaRole) {
      return usuario;
    }

    if (
      usuario.role === Role.ADMIN &&
      novaRole === Role.JOGADOR
    ) {
      const totalAdministradores =
        await this.prisma.usuario.count({
          where: { role: Role.ADMIN },
        });

      if (totalAdministradores <= 1) {
        throw new BadRequestException(
          'Não é possível remover o último administrador.',
        );
      }
    }

    return await this.prisma.usuario.update({
      where: { id },
      data: { role: novaRole },
      select: {
        id: true,
        nome: true,
        email: true,
        role: true,
      },
    });
  }

  // EDITAR USUÁRIO
  async update(
    id: number,
    updateUsuarioDto: UpdateUsuarioDto,
  ) {
    const usuario = await this.prisma.usuario.findUnique({
      where: { id },
    });

    if (!usuario) {
      throw new NotFoundException('Usuário não encontrado.');
    }

    const {
      nome,
      email,
      senhaAtual,
      senha,
      confirmarSenha,
    } = updateUsuarioDto;

    const emailNormalizado = email?.trim().toLowerCase();

    const nomeNormalizado = nome
      ?.trim()
      .toLowerCase();

    const emailMudou =
      emailNormalizado !== undefined &&
      emailNormalizado !== usuario.email.toLowerCase();

    const nomeMudou =
      nomeNormalizado !== undefined &&
      nomeNormalizado !== usuario.nome.toLowerCase();

    const senhaMudou =
      senha !== undefined && senha.length > 0;

    if (confirmarSenha !== undefined && !senhaMudou) {
      throw new BadRequestException(
        'Informe a nova senha para confirmar a alteração.',
      );
    }

    if (senhaMudou) {
      if (!confirmarSenha) {
        throw new BadRequestException(
          'Confirme a nova senha.',
        );
      }

      if (senha !== confirmarSenha) {
        throw new BadRequestException(
          'A nova senha e a confirmação não coincidem.',
        );
      }

      if (senha.length < 8 || senha.length > 128) {
        throw new BadRequestException(
          'A nova senha deve possuir entre 8 e 128 caracteres.',
        );
      }
    }

    if (emailMudou || nomeMudou || senhaMudou) {
      if (!senhaAtual) {
        throw new BadRequestException(
          'Informe sua senha atual para confirmar a alteração.',
        );
      }

      const senhaValida = await bcrypt.compare(
        senhaAtual,
        usuario.senha,
      );

      if (!senhaValida) {
        throw new BadRequestException(
          'A senha atual está incorreta.',
        );
      }
    }

    if (nome !== undefined) {
      const nomeNormalizado = nome.trim();

      if (nomeNormalizado.length < 2) {
        throw new BadRequestException(
          'O nome deve possuir pelo menos 2 caracteres.',
        );
      }

      if (nomeNormalizado.length > 80) {
        throw new BadRequestException(
          'O nome deve possuir no máximo 80 caracteres.',
        );
      }
    }

    if (nomeNormalizado !== undefined) {
      if (
        nomeNormalizado.length < 3 ||
        nomeNormalizado.length > 30
      ) {
        throw new BadRequestException(
          'O nome de usuário deve possuir entre 3 e 30 caracteres.',
        );
      }

      if (nomeMudou) {
        const nomeExistente =
          await this.prisma.usuario.findFirst({
            where: {
              nome: nomeNormalizado,
              NOT: { id },
            },
            select: { id: true },
          });

        if (nomeExistente) {
          throw new ConflictException(
            'Este nome de usuário já está sendo utilizado.',
          );
        }
      }
    }

    if (emailMudou && emailNormalizado) {
      const emailExistente =
        await this.prisma.usuario.findFirst({
          where: {
            email: emailNormalizado,
            NOT: { id },
          },
          select: { id: true },
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

    if (nome !== undefined) {
      data.nome = nome.trim();
    }

    if (nomeNormalizado !== undefined) {
      data.nome = nomeNormalizado;
    }

    if (emailNormalizado !== undefined) {
      data.email = emailNormalizado;
    }

    if (senhaMudou && senha) {
      data.senha = await bcrypt.hash(senha, 10);
    }

    if (emailMudou) {
      data.emailVerificado = false;
    }
    const usuarioAtualizado = await this.prisma.usuario.update({
      where: { id },
      data,
      include: { patente: true },
    });

    return {
      id: usuarioAtualizado.id,
      nome: usuarioAtualizado.nome,
      email: usuarioAtualizado.email,
      role: usuarioAtualizado.role,
      patenteId: usuarioAtualizado.patenteId,
      pontuacao: usuarioAtualizado.pontuacao,
      emailVerificado: usuarioAtualizado.emailVerificado,
      patente: usuarioAtualizado.patente,

      emailAlterado: emailMudou,
      nomeAlterado: nomeMudou,
      senhaAlterada: senhaMudou,
    };
  }

  // DELETAR USUÁRIO
  async remove(id: number) {
    return await this.prisma.usuario.delete({
      where: { id },
    });
  }
}