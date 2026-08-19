import { Controller, Get, Post, Body, Patch, Param, Delete, ConflictException, UseGuards } from '@nestjs/common';
import { AlternativaService } from './alternativa.service';
import { CreateAlternativaDto } from './dto/create-alternativa.dto';
import { UpdateAlternativaDto } from './dto/update-alternativa.dto';
import { PerguntaService } from 'src/pergunta/pergunta.service';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';

@Controller('alternativa')
export class AlternativaController {
  constructor(
    private readonly alternativaService: AlternativaService,
    private readonly perguntaService: PerguntaService
  ) { }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Post()
  async create(@Body() createAlternativaDto: CreateAlternativaDto) {
    const perguntaExiste = await this.perguntaService.findOne(createAlternativaDto.perguntaId);

    if (!perguntaExiste) {
      return new ConflictException('Essa pergunta não existe!')
    }

    return await this.alternativaService.create(createAlternativaDto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get()
  async findAll() {
    return await this.alternativaService.findAll();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return await this.alternativaService.findOne(Number(id));
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Patch(':id')
  async update(@Param('id') id: string, @Body() updateAlternativaDto: UpdateAlternativaDto) {
    const perguntaExiste = await this.perguntaService.findOne(updateAlternativaDto.perguntaId!);

    if (!perguntaExiste) {
      return new ConflictException('Essa pergunta não existe!')
    }

    return await this.alternativaService.update(Number(id), updateAlternativaDto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Delete(':id')
  async remove(@Param('id') id: string) {
    return await this.alternativaService.remove(Number(id));
  }
}
