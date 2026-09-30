import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';

import { CreateUsuarioDto } from './dto/create-usuario.dto';
import { UpdateUsuarioDto } from './dto/update-usuario.dto';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';

@Injectable()
export class UsuarioService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
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

    // Gera um token seguro para verificação
    const token = randomBytes(32).toString('hex');

    // Token válido por 30 minutos
    const expiraEm = new Date(
      Date.now() + 30 * 60 * 1000,
    );

    await this.prisma.verificacaoEmail.create({
      data: {
        token,
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

      // Remove usuário e token caso o envio falhe
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
      where: { id },
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

    await this.prisma.verificacaoEmail.delete({
      where: {
        id: verificacao.id,
      },
    });

    return {
      mensagem: 'E-mail verificado com sucesso.',
      emailVerificado: usuario.emailVerificado,
    };
  }

  async reenviarVerificacao(email: string) {
    const usuario = await this.prisma.usuario.findUnique({
      where: {
        email,
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

    const expiraEm = new Date(
      Date.now() + 30 * 60 * 1000,
    );

    await this.prisma.verificacaoEmail.create({
      data: {
        token,
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