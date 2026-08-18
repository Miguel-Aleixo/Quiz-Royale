import { Injectable } from '@nestjs/common';
import { CreateRodadaDto } from './dto/create-rodada.dto';
import { UpdateRodadaDto } from './dto/update-rodada.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class RodadaService {

  constructor ( private readonly prisma: PrismaService ) {}

  async create(createRodadaDto: CreateRodadaDto) {
    return await this.prisma.rodada.create({
      data: createRodadaDto
    })
  };

  async findAll() {
    return await this.prisma.rodada.findMany()
  };

  async findOne(id: number) {
    return await this.prisma.rodada.findFirst({
      where: {
        id: id
      }
    })
  };

  async update(id: number, updateRodadaDto: UpdateRodadaDto) {
    return await this.prisma.rodada.update({
      where: {
        id: id
      },
      data: updateRodadaDto
    })
  };

  async remove(id: number) {
    return await this.prisma.rodada.delete({
      where: {
        id: id
      }
    })
  };

}
