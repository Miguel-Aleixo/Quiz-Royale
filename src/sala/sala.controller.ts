import { Controller, Get, Post, Body, Patch, Param, Delete, BadRequestException, UseGuards } from '@nestjs/common';
import { SalaService } from './sala.service';
import { CreateSalaDto } from './dto/create-sala.dto';
import { UpdateSalaDto } from './dto/update-sala.dto';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';

@Controller('sala')
export class SalaController {
  constructor(private readonly salaService: SalaService) { }

  private gerarCodigo(): string {
    const caracteres = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let codigo = '';

    for (let i = 0; i < 6; i++) {
      codigo += caracteres.charAt(
        Math.floor(Math.random() * caracteres.length),
      );
    }

    return codigo;
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Post()
  async create(@Body() createSalaDto: CreateSalaDto) {
    const codigo = this.gerarCodigo();

    return await this.salaService.create(createSalaDto, codigo);
  };

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get()
  async findAll() {
    return await this.salaService.findAll();
  };

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return await this.salaService.findOne(Number(id));
  };

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Patch(':id')
  async update(@Param('id') id: string, @Body() updateSalaDto: UpdateSalaDto) {
    return await this.salaService.update(Number(id), updateSalaDto);
  };

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Delete(':id')
  async remove(@Param('id') id: string) {
    return await this.salaService.remove(Number(id));
  };

}
