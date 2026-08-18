import { Injectable } from '@nestjs/common';
import { CreateAlternativaDto } from './dto/create-alternativa.dto';
import { UpdateAlternativaDto } from './dto/update-alternativa.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class AlternativaService {
  constructor(private readonly prisma: PrismaService) { }

  async create(createAlternativaDto: CreateAlternativaDto) {
    return await this.prisma.alternativa.create({
      data: createAlternativaDto
    })
  };

  async findAll() {
    return await this.prisma.alternativa.findMany();
  };

  async findOne(id: number) {
    return await this.prisma.alternativa.findFirst({
      where: {
        id: id
      }
    })
  };

  async update(id: number, updateAlternativaDto: UpdateAlternativaDto) {
    return await this.prisma.alternativa.update({
      where: {
        id: id
      },
      data: updateAlternativaDto
    })
  };

  async remove(id: number) {
    return await this.prisma.alternativa.delete({
      where: {
        id: id
      }
    })
  };

}
