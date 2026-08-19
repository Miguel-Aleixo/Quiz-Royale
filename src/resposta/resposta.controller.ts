import { Controller, Get, Post, Body, Patch, Param, Delete, ConflictException, UseGuards } from '@nestjs/common';
import { RespostaService } from './resposta.service';
import { CreateRespostaDto } from './dto/create-resposta.dto';
import { UpdateRespostaDto } from './dto/update-resposta.dto';
import { AlternativaService } from 'src/alternativa/alternativa.service';
import { JogadorService } from 'src/jogador/jogador.service';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';

@Controller('resposta')
export class RespostaController {
  constructor(
    private readonly respostaService: RespostaService,
    private readonly alternativaService: AlternativaService,
    private readonly jogadorService: JogadorService
  ) { }

  @UseGuards(JwtAuthGuard, RolesGuard)
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

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get()
  async findAll() {
    return this.respostaService.findAll();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.respostaService.findOne(Number(id));
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
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

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.respostaService.remove(Number(id));
  }
}
