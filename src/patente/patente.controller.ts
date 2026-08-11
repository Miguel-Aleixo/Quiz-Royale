import { Controller, Get, Post, Body, Patch, Param, Delete, ConflictException } from '@nestjs/common';
import { PatenteService } from './patente.service';
import { CreatePatenteDto } from './dto/create-patente.dto';
import { UpdatePatenteDto } from './dto/update-patente.dto';

@Controller('patente')
export class PatenteController {
  constructor(private readonly patenteService: PatenteService) { }

  @Post()
  async create(@Body() createPatenteDto: CreatePatenteDto) {
    const patenteExiste = await this.patenteService.findName(createPatenteDto.nome);

    if (patenteExiste) {
      return new ConflictException('Essa patente já existe!')
    };

    return this.patenteService.create(createPatenteDto);
  }

  @Get()
  async findAll() {
    return this.patenteService.findAll();
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() updatePatenteDto: UpdatePatenteDto) {
    const patenteExiste = await this.patenteService.findName(updatePatenteDto.nome!);

    if (patenteExiste) {
      return new ConflictException('Essa patente já existe!')
    };

    return this.patenteService.update(Number(id), updatePatenteDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.patenteService.remove(Number(id));
  }
}
