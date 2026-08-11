import { Controller, Get, Post, Body, Patch, Param, Delete, ConflictException } from '@nestjs/common';
import { AlternativaService } from './alternativa.service';
import { CreateAlternativaDto } from './dto/create-alternativa.dto';
import { UpdateAlternativaDto } from './dto/update-alternativa.dto';
import { PerguntaService } from 'src/pergunta/pergunta.service';

@Controller('alternativa')
export class AlternativaController {
  constructor(
    private readonly alternativaService: AlternativaService,
    private readonly perguntaService: PerguntaService
  ) { }

  @Post()
  async create(@Body() createAlternativaDto: CreateAlternativaDto) {
    const perguntaExiste = await this.perguntaService.findOne(createAlternativaDto.perguntaId);

    if (!perguntaExiste) {
      return new ConflictException('Essa pergunta não existe!')
    }

    return await this.alternativaService.create(createAlternativaDto);
  }

  @Get()
  async findAll() {
    return await this.alternativaService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return await this.alternativaService.findOne(Number(id));
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() updateAlternativaDto: UpdateAlternativaDto) {
    const perguntaExiste = await this.perguntaService.findOne(updateAlternativaDto.perguntaId!);

    if (!perguntaExiste) {
      return new ConflictException('Essa pergunta não existe!')
    }

    return await this.alternativaService.update(Number(id), updateAlternativaDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return await this.alternativaService.remove(Number(id));
  }
}
