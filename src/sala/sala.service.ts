import { Injectable } from '@nestjs/common';
import { CreateSalaDto } from './dto/create-sala.dto';
import { UpdateSalaDto } from './dto/update-sala.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class SalaService {
  constructor ( private readonly prisma: PrismaService ) {}

  async create(createSalaDto: CreateSalaDto, codigo: string) {
    return await this.prisma.sala.create({
      data: {...createSalaDto, codigo}
    })
  };

  async findAll() {
    return await this.prisma.sala.findMany();
  };

  async findOne(id: number) {
    return await this.prisma.sala.findFirst({
      where: {
        id: id
      }
    })
  };

  async update(id: number, updateSalaDto: UpdateSalaDto) {
    return await this.prisma.sala.update({
      where: {
        id: id
      },
      data: updateSalaDto
    })
  };

  async remove(id: number) {
    return await this.prisma.sala.delete({
      where: {
        id: id
      }
    })
  };

}
