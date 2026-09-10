import { Injectable } from '@nestjs/common';
import { CreateTemaDto } from './dto/create-tema.dto';
import { UpdateTemaDto } from './dto/update-tema.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { time } from 'console';

@Injectable()
export class TemaService {
  constructor(private readonly prisma: PrismaService) { }

  async create(createTemaDto: CreateTemaDto) {
    return await this.prisma.tema.create({
      data: createTemaDto
    })
  };

  async findAll() {
    return await this.prisma.tema.findMany()
  };

  async findName(nome: string) {
    return await this.prisma.tema.findFirst({
      where: {
        nome: nome
      }
    })
  };

  async findOne(id: number) {
    return await this.prisma.tema.findFirst({
      where: {
        id: id
      }
    })
  };

  async update(id: number, updateTemaDto: UpdateTemaDto) {
    return await this.prisma.tema.update({
      where: {
        id: id
      },
      data: updateTemaDto
    })
  };

  async remove(id: number) {
    return await this.prisma.tema.delete({
      where: {
        id: id
      }
    })
  };

}
