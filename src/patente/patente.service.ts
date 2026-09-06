import { ConflictException, Injectable } from '@nestjs/common';
import { CreatePatenteDto } from './dto/create-patente.dto';
import { UpdatePatenteDto } from './dto/update-patente.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class PatenteService {
  constructor(private readonly prisma: PrismaService) { }

  async create(createPatenteDto: CreatePatenteDto) {
    return await this.prisma.patente.create({
      data: createPatenteDto
    })
  };

  async findAll() {
    return await this.prisma.patente.findMany()
  };

  async findName(nome: string) {
    return await this.prisma.patente.findFirst({
      where: {
        nome: nome
      }
    })
  };

  async update(id: number, updatePatenteDto: UpdatePatenteDto) {
    return await this.prisma.patente.update({
      where: {
        id: id
      },
      data: updatePatenteDto
    })
  };

  async remove(id: number) {
    const usuarios = await this.prisma.usuario.count({
      where: {
        patenteId: id,
      },
    });

    if (usuarios > 0) {
      throw new ConflictException(
        `Não é possível excluir esta patente. Existem ${usuarios} usuário(s) vinculados a ela.`,
      );
    }

    return await this.prisma.patente.delete({
      where: {
        id,
      },
    });
  }
}
