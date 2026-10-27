
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

import { RodadaService } from './rodada.service';
import { CreateRodadaDto } from './dto/create-rodada.dto';
import { UpdateRodadaDto } from './dto/update-rodada.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

interface AuthenticatedRequest extends Request {
  user: {
    id: number | string;
    role: 'ADMIN' | 'JOGADOR';
  };
}

@Controller('rodada')
@UseGuards(JwtAuthGuard)
export class RodadaController {
  constructor(
    private readonly rodadaService: RodadaService,
  ) {}

  @Post()
  create(
    @Body() dto: CreateRodadaDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.rodadaService.create(
      dto,
      Number(req.user.id),
      req.user.role,
    );
  }

  @Get()
  findAll() {
    return this.rodadaService.findAll();
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateRodadaDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.rodadaService.update(
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
    return this.rodadaService.remove(
      id,
      Number(req.user.id),
      req.user.role,
    );
  }
}
