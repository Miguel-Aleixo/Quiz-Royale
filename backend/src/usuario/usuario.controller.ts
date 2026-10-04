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
  Query,
  Req,
  NotFoundException
} from '@nestjs/common';

import type { Request } from 'express';

import { UsuarioService } from './usuario.service';
import { CreateUsuarioDto } from './dto/create-usuario.dto';
import { UpdateUsuarioDto } from './dto/update-usuario.dto';
import { RolesGuard } from '../auth/guards/roles.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

interface AuthenticatedRequest extends Request {
  user: {
    id: number;
    email: string;
    role: string;
  };
}

@Controller('usuario')
export class UsuarioController {
  constructor(
    private readonly usuarioService: UsuarioService,
  ) { }

  @Post()
  async create(
    @Body() createUsuarioDto: CreateUsuarioDto,
  ) {
    const emailExiste =
      await this.usuarioService.findByEmail(
        createUsuarioDto.email,
      );

    if (emailExiste) {
      throw new ConflictException(
        'Esse email já está sendo usado!',
      );
    }

    return this.usuarioService.create(
      createUsuarioDto,
    );
  }

  @Post('/admin')
  async createAdmin(
    @Body() createUsuarioDto: CreateUsuarioDto,
  ) {
    const emailExiste =
      await this.usuarioService.findByEmail(
        createUsuarioDto.email,
      );

    if (emailExiste) {
      throw new ConflictException(
        'Esse email já está sendo usado!',
      );
    }

    return this.usuarioService.createAdmin(
      createUsuarioDto,
    );
  }

  // =====================================================
  // VERIFICAÇÃO DE E-MAIL
  // =====================================================

  @Get('/verificar-email')
  async verificarEmail(
    @Query('token') token: string,
  ) {
    return this.usuarioService.verificarEmail(token);
  }

  @UseGuards(JwtAuthGuard)
  @Post('reenviar-verificacao')
  async reenviarVerificacao(
    @Req() req: AuthenticatedRequest,
  ) {
    return this.usuarioService.reenviarVerificacaoPorId(
      req.user.id,
    );
  }

  @Get('/status-verificacao')
  async statusVerificacao(
    @Query('token') token: string,
  ) {
    return this.usuarioService.verificarSessaoEmail(token);
  }


  // =====================================================
  // USUÁRIOS
  // =====================================================

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get()
  async findAll() {
    return this.usuarioService.findAll();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get(':id')
  async findOne(
    @Param('id') id: string,
  ) {
    return this.usuarioService.findOne(
      Number(id),
    );
  }

  @Post('esquecer-senha')
  async esquecerSenha(
    @Body('email') email: string,
  ) {
    return this.usuarioService.solicitarRecuperacaoSenha(
      email,
    );
  }

  @Post('redefinir-senha')
  async redefinirSenha(
    @Body('token') token: string,
    @Body('senha') senha: string,
  ) {
    return this.usuarioService.redefinirSenha(
      token,
      senha,
    );
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateUsuarioDto: UpdateUsuarioDto,
  ) {
    if (updateUsuarioDto.email) {
      const emailExiste =
        await this.usuarioService.findByEmail(
          updateUsuarioDto.email,
        );

      if (
        emailExiste &&
        emailExiste.id !== Number(id)
      ) {
        throw new ConflictException(
          'Esse email já está sendo usado!',
        );
      }
    }

    return this.usuarioService.update(
      Number(id),
      updateUsuarioDto,
    );
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Delete(':id')
  async remove(
    @Param('id') id: string,
  ) {
    return this.usuarioService.remove(
      Number(id),
    );
  }
}