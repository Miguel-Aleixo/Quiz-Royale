import * as bcrypt from 'bcrypt';
import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateUsuarioDto } from './dto/create-usuario.dto';
import { UpdateUsuarioDto } from './dto/update-usuario.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsuarioService {
  constructor(private readonly prisma: PrismaService) { }

  async create(createUsuarioDto: CreateUsuarioDto) {

    const senhaHash = await bcrypt.hash(
      createUsuarioDto.senha,
      10
    );

    return await this.prisma.usuario.create({
      data: { ...createUsuarioDto, senha: senhaHash, role: 'JOGADOR' }
    })
  };

  async createAdmin(createUsuarioDto: CreateUsuarioDto) {

    const senhaHash = await bcrypt.hash(
      createUsuarioDto.senha,
      10
    );

    return await this.prisma.usuario.create({
      data: { ...createUsuarioDto, senha: senhaHash, role: 'ADMIN' }
    })
  };

  async findAll() {
    return await this.prisma.usuario.findMany()
  };

  async findByEmail(email: string) {
    return await this.prisma.usuario.findFirst({
      where: {
        email: email
      }
    })
  };

  async findOne(id: number) {
    return await this.prisma.usuario.findFirst({
      where: {
        id: id
      }
    })
  };

  async update(id: number, updateUsuarioDto: UpdateUsuarioDto) {
    return await this.prisma.usuario.update({
      where: {
        id: id
      },
      data: updateUsuarioDto
    })
  };

  async atualizarPatente(usuarioId: number) {
    const usuario = await this.prisma.usuario.findUnique({
      where: { id: usuarioId },
      select: {
        id: true,
        pontuacao: true,
        patenteId: true,
      },
    });

    if (!usuario) {
      throw new NotFoundException('Usuário não encontrado');
    }

    const patente = await this.prisma.patente.findFirst({
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
        where: { id: usuarioId },
        data: {
          patenteId: patente.id,
        },
        include: {
          patente: true,
        },
      });
    }

    return await this.prisma.usuario.findUnique({
      where: { id: usuarioId },
      include: {
        patente: true,
      },
    });
  }

  async remove(id: number) {
    return await this.prisma.usuario.delete({
      where: {
        id: id
      }
    })
  };

}
