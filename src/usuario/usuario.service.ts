import { Injectable } from '@nestjs/common';
import { CreateUsuarioDto } from './dto/create-usuario.dto';
import { UpdateUsuarioDto } from './dto/update-usuario.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class UsuarioService {
  constructor(private readonly prisma: PrismaService) { }

  async create(createUsuarioDto: CreateUsuarioDto) {
    return await this.prisma.usuario.create({
      data: createUsuarioDto
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

  async remove(id: number) {
    return await this.prisma.usuario.delete({
      where: {
        id: id
      }
    })
  };

}
