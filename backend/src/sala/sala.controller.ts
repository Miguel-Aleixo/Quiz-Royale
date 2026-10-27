
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
  ParseIntPipe,
} from '@nestjs/common';
import type { Request } from 'express';

import { SalaService } from './sala.service';
import { CreateSalaDto } from './dto/create-sala.dto';
import { UpdateSalaDto } from './dto/update-sala.dto';
import { EntrarSalaDto } from './dto/entrar-sala.dto';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { EmailVerificadoGuard } from '../auth/guards/email-verificado.guard';

interface AuthenticatedRequest extends Request {
  user: {
    id: number;
    email: string;
    role: 'ADMIN' | 'JOGADOR';
  };
}

@Controller('sala')
@UseGuards(JwtAuthGuard, RolesGuard, EmailVerificadoGuard)
export class SalaController {
  constructor(private readonly salaService: SalaService) {}

  private gerarCodigo(): string {
    const caracteres = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

    return Array.from(
      { length: 6 },
      () => caracteres.charAt(
        Math.floor(Math.random() * caracteres.length),
      ),
    ).join('');
  }

  @Post()
  create(
    @Body() dto: CreateSalaDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.salaService.create(
      dto,
      this.gerarCodigo(),
      req.user.id,
    );
  }

  @Post('entrar')
  entrar(
    @Body() dto: EntrarSalaDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.salaService.entrar(dto.codigo, req.user.id);
  }

  @Get('codigo/:codigo')
  buscarPorCodigo(@Param('codigo') codigo: string) {
    return this.salaService.buscarPorCodigo(codigo);
  }

  @Delete('sair/:codigo')
  sairDaSala(
    @Param('codigo') codigo: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.salaService.sairDaSala(codigo, req.user.id);
  }

  @Get()
  findAll() {
    return this.salaService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.salaService.findOne(id);
  }

  @Patch(':id/reabrir')
  reabrir(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.salaService.reabrir(id, req.user.id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateSalaDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.salaService.update(
      id,
      dto,
      req.user.id,
      req.user.role,
    );
  }

  @Delete(':id')
  remove(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.salaService.remove(
      id,
      req.user.id,
      req.user.role,
    );
  }
}
