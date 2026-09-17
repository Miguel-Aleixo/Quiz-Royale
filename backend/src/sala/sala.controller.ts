import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Req,
} from '@nestjs/common';
import { Request } from 'express';

import { SalaService } from './sala.service';
import { CreateSalaDto } from './dto/create-sala.dto';
import { UpdateSalaDto } from './dto/update-sala.dto';
import { EntrarSalaDto } from './dto/entrar-sala.dto';

import { RolesGuard } from '../auth/guards/roles.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('sala')
export class SalaController {
  constructor(private readonly salaService: SalaService) {}

  private gerarCodigo(): string {
    const caracteres =
      'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

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
  async create(
    @Body() createSalaDto: CreateSalaDto,
    @Req() req: Request,
  ) {
    const codigo = this.gerarCodigo();

    const usuarioId = req.user.id;

    return await this.salaService.create(
      createSalaDto,
      codigo,
      usuarioId,
    );
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Post('entrar')
  async entrar(
    @Body() entrarSalaDto: EntrarSalaDto,
    @Req() req: Request,
  ) {
    const usuarioId = req.user.id;

    return await this.salaService.entrar(
      entrarSalaDto.codigo,
      usuarioId,
    );
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get()
  async findAll() {
    return await this.salaService.findAll();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return await this.salaService.findOne(Number(id));
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateSalaDto: UpdateSalaDto,
  ) {
    return await this.salaService.update(
      Number(id),
      updateSalaDto,
    );
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Delete(':id')
  async remove(@Param('id') id: string) {
    return await this.salaService.remove(Number(id));
  }
}