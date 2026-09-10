import { Injectable } from '@nestjs/common';
import { CreateJogadorDto } from './dto/create-jogador.dto';
import { UpdateJogadorDto } from './dto/update-jogador.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class JogadorService {
  constructor ( private readonly prisma: PrismaService ) {}

  async create(createJogadorDto: CreateJogadorDto) {
    return await this.prisma.jogador.create({
      data: createJogadorDto
    })
  };

  async findAll() {
    return await this.prisma.jogador.findMany();
  };

  async findOne(id: number) {
    return await this.prisma.jogador.findFirst({
      where: {
        id: id
      }
    })
  };

  async update(id: number, updateJogadorDto: UpdateJogadorDto) {
    return await this.prisma.jogador.update({
      where: {
        id: id
      },
      data: updateJogadorDto
    })
  };

  async remove(id: number) {
    return await this.prisma.jogador.delete({
      where: {
        id: id
      }
    })
  };
  
}
