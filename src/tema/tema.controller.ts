import { Controller, Get, Post, Body, Patch, Param, Delete, ConflictException } from '@nestjs/common';
import { TemaService } from './tema.service';
import { CreateTemaDto } from './dto/create-tema.dto';
import { UpdateTemaDto } from './dto/update-tema.dto';

@Controller('tema')
export class TemaController {
  constructor(private readonly temaService: TemaService) { }

  @Post()
  async create(@Body() createTemaDto: CreateTemaDto) {
    const temaExiste = await this.temaService.findName(createTemaDto.nome);

    if (temaExiste) {
      return new ConflictException('Essa patente já existe!')
    };

    return this.temaService.create(createTemaDto);
  };

  @Get()
  findAll() {
    return this.temaService.findAll();
  };

  @Patch(':id')
  async update(@Param('id') id: string, @Body() updateTemaDto: UpdateTemaDto) {
    const TemaExiste = await this.temaService.findName(updateTemaDto.nome!);

    if (TemaExiste) {
      return new ConflictException('Esse tema já existe!')
    };

    return this.temaService.update(Number(id), updateTemaDto);
  };

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.temaService.remove(Number(id));
  };
}
