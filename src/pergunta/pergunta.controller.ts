import { Controller, Get, Post, Body, Patch, Param, Delete, ConflictException } from '@nestjs/common';
import { PerguntaService } from './pergunta.service';
import { CreatePerguntaDto } from './dto/create-pergunta.dto';
import { UpdatePerguntaDto } from './dto/update-pergunta.dto';
import { TemaService } from 'src/tema/tema.service';

@Controller('pergunta')
export class PerguntaController {
  constructor(
    private readonly perguntaService: PerguntaService,
    private readonly temaService: TemaService) { }

  @Post()
  async create(@Body() createPerguntaDto: CreatePerguntaDto) {
    const TemaExiste = await this.temaService.findOne(createPerguntaDto.temaId);

    if (!TemaExiste) {
      return new ConflictException('Esse tema não existe!')
    };

    return this.perguntaService.create(createPerguntaDto);
  };

  @Get()
  findAll() {
    return this.perguntaService.findAll();
  };

  @Patch(':id')
  async update(@Param('id') id: string, @Body() updatePerguntaDto: UpdatePerguntaDto) {
    const TemaExiste = await this.temaService.findOne(updatePerguntaDto.temaId!);

    if (!TemaExiste) {
      return new ConflictException('Esse tema não existe!')
    };

    return this.perguntaService.update(Number(id), updatePerguntaDto);
  };

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.perguntaService.remove(Number(id));
  };

}
