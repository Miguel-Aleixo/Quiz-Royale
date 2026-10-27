
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ConflictException,
  UseGuards,
  Req,
  ParseIntPipe,
} from '@nestjs/common';
import type { Request } from 'express';

import { PerguntaService } from './pergunta.service';
import { CreatePerguntaDto } from './dto/create-pergunta.dto';
import { UpdatePerguntaDto } from './dto/update-pergunta.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TemaService } from '../tema/tema.service';

interface AuthenticatedRequest extends Request {
  user: {
    id: number | string;
    role: 'ADMIN' | 'JOGADOR';
  };
}

@Controller('pergunta')
@UseGuards(JwtAuthGuard)
export class PerguntaController {
  constructor(
    private readonly perguntaService: PerguntaService,
    private readonly temaService: TemaService,
  ) {}

  @Post()
  async create(
    @Body() dto: CreatePerguntaDto,
    @Req() req: AuthenticatedRequest,
  ) {
    const tema = await this.temaService.findOne(dto.temaId);

    if (!tema) {
      throw new ConflictException('Esse tema não existe!');
    }

    return this.perguntaService.create(dto, Number(req.user.id));
  }

  @Get()
  findAll() {
    return this.perguntaService.findAll();
  }

  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdatePerguntaDto,
    @Req() req: AuthenticatedRequest,
  ) {
    if (dto.temaId !== undefined) {
      const tema = await this.temaService.findOne(dto.temaId);

      if (!tema) {
        throw new ConflictException('Esse tema não existe!');
      }
    }

    return this.perguntaService.update(
      id,
      dto,
      Number(req.user.id),
      req.user.role,
    );
  }

  @Delete(':id')
  remove(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.perguntaService.remove(
      id,
      Number(req.user.id),
      req.user.role,
    );
  }
}
