
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

import { AlternativaService } from './alternativa.service';
import { CreateAlternativaDto } from './dto/create-alternativa.dto';
import { UpdateAlternativaDto } from './dto/update-alternativa.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

interface AuthenticatedRequest extends Request {
  user: {
    id: number | string;
    role: 'ADMIN' | 'JOGADOR';
  };
}

@Controller('alternativa')
@UseGuards(JwtAuthGuard)
export class AlternativaController {
  constructor(
    private readonly alternativaService: AlternativaService,
  ) {}

  @Post()
  create(
    @Body() dto: CreateAlternativaDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.alternativaService.create(
      dto,
      Number(req.user.id),
      req.user.role,
    );
  }

  @Get()
  findAll() {
    return this.alternativaService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.alternativaService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateAlternativaDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.alternativaService.update(
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
    return this.alternativaService.remove(
      id,
      Number(req.user.id),
      req.user.role,
    );
  }
}
