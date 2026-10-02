import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
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
    return await this.prisma.usuario.update({
      where: {
        id,
      },
      data: updateUsuarioDto,
    });
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

  async remove(id: number) {
    return await this.prisma.usuario.delete({
      where: {
        id,
      },
    });
  }
}

