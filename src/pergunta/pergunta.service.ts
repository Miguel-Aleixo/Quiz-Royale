import { Injectable } from '@nestjs/common';
import { CreatePerguntaDto } from './dto/create-pergunta.dto';
import { UpdatePerguntaDto } from './dto/update-pergunta.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class PerguntaService {

  constructor(private readonly prisma: PrismaService) { }

  async create(createPerguntaDto: CreatePerguntaDto) {
    return await this.prisma.pergunta.create({
      data: createPerguntaDto
    })
  };

  async findAll() {
    return await this.prisma.pergunta.findMany();
  };

  async findOne(id: number) {
    return await this.prisma.pergunta.findFirst({
      where: {
        id: id
      }
    });
  };

  async update(id: number, updatePerguntaDto: UpdatePerguntaDto) {
    return await this.prisma.pergunta.update({
      where: {
        id: id
      },
      data: updatePerguntaDto
    })
  };

  async remove(id: number) {
    return await this.prisma.pergunta.delete({
      where: {
        id: id
      }
    })
  };

}
