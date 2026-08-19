import { Controller, Get, Post, Body, Patch, Param, Delete, ConflictException, UseGuards } from '@nestjs/common';
import { RodadaService } from './rodada.service';
import { CreateRodadaDto } from './dto/create-rodada.dto';
import { UpdateRodadaDto } from './dto/update-rodada.dto';
import { PerguntaService } from 'src/pergunta/pergunta.service';
import { SalaService } from 'src/sala/sala.service';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';

@Controller('rodada')
export class RodadaController {
  constructor(
    private readonly rodadaService: RodadaService,
    private readonly perguntaService: PerguntaService,
    private readonly salaService: SalaService
  ) { }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Post()
  async create(@Body() createRodadaDto: CreateRodadaDto) {
    const perguntaExiste = await this.perguntaService.findOne(createRodadaDto.perguntaId);
    const salaExiste = await this.salaService.findOne(createRodadaDto.salaId);

    if (!perguntaExiste) {
      return new ConflictException('Essa pergunta não existe!')
    }

    if (!salaExiste) {
      return new ConflictException('Essa sala não existe!')
    }


    return this.rodadaService.create(createRodadaDto);
  };

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get()
  async findAll() {
    return await this.rodadaService.findAll();
  };

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Patch(':id')
  async update(@Param('id') id: string, @Body() updateRodadaDto: UpdateRodadaDto) {
    const perguntaExiste = await this.perguntaService.findOne(updateRodadaDto.perguntaId!);
    const salaExiste = await this.salaService.findOne(updateRodadaDto.salaId!);

    if (!perguntaExiste) {
      return new ConflictException('Essa pergunta não existe!')
    }

    if (!salaExiste) {
      return new ConflictException('Essa sala não existe!')
    }

    return this.rodadaService.update(Number(id), updateRodadaDto);
  };

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.rodadaService.remove(Number(id));
  };

}
