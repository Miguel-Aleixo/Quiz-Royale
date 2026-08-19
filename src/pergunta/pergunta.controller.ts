import { Controller, Get, Post, Body, Patch, Param, Delete, ConflictException, UseGuards } from '@nestjs/common';
import { PerguntaService } from './pergunta.service';
import { CreatePerguntaDto } from './dto/create-pergunta.dto';
import { UpdatePerguntaDto } from './dto/update-pergunta.dto';
import { TemaService } from 'src/tema/tema.service';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';

@Controller('pergunta')
export class PerguntaController {
  constructor(
    private readonly perguntaService: PerguntaService,
    private readonly temaService: TemaService) { }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Post()
  async create(@Body() createPerguntaDto: CreatePerguntaDto) {
    const TemaExiste = await this.temaService.findOne(createPerguntaDto.temaId);

    if (!TemaExiste) {
      return new ConflictException('Esse tema não existe!')
    };

    return this.perguntaService.create(createPerguntaDto);
  };

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get()
  findAll() {
    return this.perguntaService.findAll();
  };

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Patch(':id')
  async update(@Param('id') id: string, @Body() updatePerguntaDto: UpdatePerguntaDto) {
    const TemaExiste = await this.temaService.findOne(updatePerguntaDto.temaId!);

    if (!TemaExiste) {
      return new ConflictException('Esse tema não existe!')
    };

    return this.perguntaService.update(Number(id), updatePerguntaDto);
  };

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.perguntaService.remove(Number(id));
  };

}
