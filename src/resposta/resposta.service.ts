import { Injectable } from '@nestjs/common';
import { CreateRespostaDto } from './dto/create-resposta.dto';
import { UpdateRespostaDto } from './dto/update-resposta.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class RespostaService {

  constructor(private readonly prisma: PrismaService) { }

  async create(createRespostaDto: CreateRespostaDto) {
    return await this.prisma.resposta.create({
      data: createRespostaDto
    })
  };

  async findAll() {
    return await this.prisma.resposta.findMany();
  };

  async findOne(id: number) {
    return await this.prisma.resposta.findFirst({
      where: {
        id: id
      }
    })
  };

  async update(id: number, updateRespostaDto: UpdateRespostaDto) {
    return await this.prisma.resposta.update({
      where: {
        id: id
      },
      data: updateRespostaDto
    })
  };

  async remove(id: number) {
    return await this.prisma.resposta.delete({
      where: {
        id: id
      }
    })
  };

}
