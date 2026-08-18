import { Controller, Get, Post, Body, Patch, Param, Delete, ConflictException } from '@nestjs/common';
import { RespostaService } from './resposta.service';
import { CreateRespostaDto } from './dto/create-resposta.dto';
import { UpdateRespostaDto } from './dto/update-resposta.dto';
import { AlternativaService } from 'src/alternativa/alternativa.service';
import { JogadorService } from 'src/jogador/jogador.service';

@Controller('resposta')
export class RespostaController {
  constructor(
    private readonly respostaService: RespostaService,
    private readonly alternativaService: AlternativaService,
    private readonly jogadorService: JogadorService
  ) { }

  @Post()
  async create(@Body() createRespostaDto: CreateRespostaDto) {
    const jogadorExiste = await this.jogadorService.findOne(createRespostaDto.jogadorId);
    const alternativaExiste = await this.alternativaService.findOne(createRespostaDto.alternativaId);

    if (!jogadorExiste) {
      return new ConflictException('Esse jogador não existe!')
    }

    if (!alternativaExiste) {
      return new ConflictException('Essa alternativa não existe!')
    }

    return this.respostaService.create(createRespostaDto);
  };

  @Get()
  async findAll() {
    return this.respostaService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.respostaService.findOne(Number(id));
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() updateRespostaDto: UpdateRespostaDto) {
    const jogadorExiste = await this.jogadorService.findOne(updateRespostaDto.jogadorId!);
    const alternativaExiste = await this.alternativaService.findOne(updateRespostaDto.alternativaId!);

    if (!jogadorExiste) {
      return new ConflictException('Esse jogador não existe!')
    }

    if (!alternativaExiste) {
      return new ConflictException('Essa alternativa não existe!')
    }

    return this.respostaService.update(Number(id), updateRespostaDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.respostaService.remove(Number(id));
  }
}
