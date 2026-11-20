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
  ParseIntPipe,
  ForbiddenException,
} from '@nestjs/common';

import type { Request } from 'express';

import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';

// SERVICE
import { UsuarioService } from './usuario.service';

// DTO
import { CreateUsuarioDto } from './dto/create-usuario.dto';
import { UpdateUsuarioDto } from './dto/update-usuario.dto';
import { AlterarRoleDto } from './dto/alterar-role.dto';

// SEGURANÇA
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../auth/decorators/roles.decorators';
import { RolesGuard } from '../auth/guards/roles.guard';

interface AuthenticatedRequest extends Request {
  user: {
    id: number;
    email: string;
    role: string;
  };
}

@ApiTags('Usuários')
@Controller('usuario')
export class UsuarioController {
  constructor(
    private readonly usuarioService: UsuarioService,
  ) {}

  // CRIAR USUÁRIO
  @Post()
  @ApiOperation({
    summary: 'Criar novo usuário',
    description: 'Realiza o cadastro de um novo usuário na plataforma.',
  })
  @ApiBody({ type: CreateUsuarioDto })
  @ApiResponse({ status: 201, description: 'Usuário criado com sucesso.' })
  @ApiResponse({ status: 400, description: 'Dados inválidos.' })
  @ApiResponse({ status: 409, description: 'E-mail ou nome de usuário já utilizado.' })
  async create(
    @Body() createUsuarioDto: CreateUsuarioDto,
  ) {
    const usuarioExiste =
      await this.usuarioService.findByEmailOuUsuario(
        createUsuarioDto.email,
      );

    if (usuarioExiste) {
      throw new ConflictException(
        'Esse email ou nome de usuario já está sendo usado!',
      );
    }

    return this.usuarioService.create(
      createUsuarioDto,
    );
  }

  // CRIAR ADMIN
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Post('/admin')
  @ApiOperation({
    summary: 'Criar administrador',
    description: 'Permite que um administrador cadastre outro administrador.',
  })
  @ApiBody({ type: CreateUsuarioDto })
  @ApiResponse({ status: 201, description: 'Administrador criado com sucesso.' })
  @ApiResponse({ status: 401, description: 'Não autenticado.' })
  @ApiResponse({ status: 403, description: 'Acesso restrito a administradores.' })
  @ApiResponse({ status: 409, description: 'E-mail já utilizado.' })
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

  // VERIFICAÇÃO DE E-MAIL
  @Get('/verificar-email')
  @ApiOperation({
    summary: 'Verificar e-mail',
    description: 'Valida o token enviado ao e-mail do usuário.',
  })
  @ApiQuery({
    name: 'token',
    required: true,
    description: 'Token de verificação de e-mail.',
  })
  @ApiResponse({ status: 200, description: 'E-mail verificado com sucesso.' })
  @ApiResponse({ status: 400, description: 'Token inválido ou expirado.' })
  async verificarEmail(
    @Query('token') token: string,
  ) {
    return this.usuarioService.verificarEmail(token);
  }

  // REENVIAR VERIFICAÇÃO DE E-MAIL
  @UseGuards(JwtAuthGuard)
  @Post('reenviar-verificacao')
  @ApiOperation({
    summary: 'Reenviar verificação de e-mail',
    description: 'Solicita um novo envio do e-mail de verificação para o usuário autenticado.',
  })
  @ApiResponse({ status: 200, description: 'Solicitação processada com sucesso.' })
  @ApiResponse({ status: 401, description: 'Não autenticado.' })
  async reenviarVerificacao(
    @Req() req: AuthenticatedRequest,
  ) {
    return this.usuarioService.reenviarVerificacaoPorId(
      req.user.id,
    );
  }

  // MOSTRAR STATUS DA VERIFICAÇÃO
  @Get('/status-verificacao')
  @ApiOperation({
    summary: 'Consultar status da verificação',
    description: 'Verifica a situação da sessão de confirmação de e-mail.',
  })
  @ApiQuery({
    name: 'token',
    required: true,
    description: 'Token de verificação.',
  })
  @ApiResponse({ status: 200, description: 'Status da verificação retornado.' })
  @ApiResponse({ status: 400, description: 'Token inválido ou expirado.' })
  async statusVerificacao(
    @Query('token') token: string,
  ) {
    return this.usuarioService.verificarSessaoEmail(token);
  }

  // BUSCAR USUÁRIOS
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get()
  @ApiOperation({
    summary: 'Listar usuários',
    description: 'Retorna a lista de usuários cadastrados.',
  })
  @ApiResponse({ status: 200, description: 'Lista de usuários retornada.' })
  @ApiResponse({ status: 401, description: 'Não autenticado.' })
  @ApiResponse({ status: 403, description: 'Sem permissão para acessar.' })
  async findAll() {
    return this.usuarioService.findAll();
  }

  // BUSCAR ESTATÍSTICAS
  @UseGuards(JwtAuthGuard)
  @Get('me/estatisticas')
  @ApiOperation({
    summary: 'Consultar minhas estatísticas',
    description: 'Retorna as estatísticas do usuário autenticado.',
  })
  @ApiResponse({ status: 200, description: 'Estatísticas retornadas com sucesso.' })
  @ApiResponse({ status: 401, description: 'Não autenticado.' })
  async minhasEstatisticas(
    @Req() req: AuthenticatedRequest,
  ) {
    return this.usuarioService.obterEstatisticas(
      req.user.id,
    );
  }

  // BUSCAR PARTIDAS RECENTES
  @UseGuards(JwtAuthGuard)
  @Get('me/partidas-recentes')
  @ApiOperation({
    summary: 'Consultar minhas partidas recentes',
    description: 'Retorna o histórico recente de partidas do usuário autenticado.',
  })
  @ApiQuery({
    name: 'limite',
    required: false,
    description: 'Quantidade de partidas a retornar.',
    example: 5,
  })
  @ApiResponse({ status: 200, description: 'Partidas recentes retornadas.' })
  @ApiResponse({ status: 401, description: 'Não autenticado.' })
  async minhasPartidasRecentes(
    @Req() req: AuthenticatedRequest,
    @Query('limite') limite?: string,
  ) {
    const quantidade = limite
      ? Number(limite)
      : 5;

    return this.usuarioService.obterPartidasRecentes(
      req.user.id,
      quantidade,
    );
  }

  // BUSCAR USUÁRIO
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get(':id')
  @ApiOperation({
    summary: 'Buscar usuário por ID',
    description: 'Retorna os dados de um usuário específico.',
  })
  @ApiParam({
    name: 'id',
    description: 'Identificador do usuário.',
    example: 1,
  })
  @ApiResponse({ status: 200, description: 'Usuário encontrado.' })
  @ApiResponse({ status: 401, description: 'Não autenticado.' })
  @ApiResponse({ status: 404, description: 'Usuário não encontrado.' })
  async findOne(
    @Param('id') id: string,
  ) {
    return this.usuarioService.findOne(
      Number(id),
    );
  }

  // RECUPERAR SENHA
  @Post('esquecer-senha')
  @ApiOperation({
    summary: 'Solicitar recuperação de senha',
    description: 'Solicita o envio de instruções para redefinição de senha.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        email: {
          type: 'string',
          example: 'usuario@email.com',
        },
      },
      required: ['email'],
    },
  })
  @ApiResponse({ status: 200, description: 'Solicitação processada.' })
  @ApiResponse({ status: 400, description: 'Dados inválidos.' })
  async esquecerSenha(
    @Body('email') email: string,
  ) {
    return this.usuarioService.solicitarRecuperacaoSenha(
      email,
    );
  }

  // REDEFINIR SENHA
  @Post('redefinir-senha')
  @ApiOperation({
    summary: 'Redefinir senha',
    description: 'Altera a senha utilizando um token de recuperação válido.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        token: {
          type: 'string',
          example: 'token-de-recuperacao',
        },
        senha: {
          type: 'string',
          example: 'NovaSenha123!',
        },
      },
      required: ['token', 'senha'],
    },
  })
  @ApiResponse({ status: 200, description: 'Senha redefinida com sucesso.' })
  @ApiResponse({ status: 400, description: 'Token inválido ou expirado.' })
  async redefinirSenha(
    @Body('token') token: string,
    @Body('senha') senha: string,
  ) {
    return this.usuarioService.redefinirSenha(
      token,
      senha,
    );
  }

  // ALTERAR PERMISSÕES
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Patch(':id/role')
  @ApiOperation({
    summary: 'Alterar nível de acesso',
    description: 'Permite que um administrador altere a função de um usuário.',
  })
  @ApiParam({
    name: 'id',
    description: 'Identificador do usuário.',
    example: 1,
  })
  @ApiBody({ type: AlterarRoleDto })
  @ApiResponse({ status: 200, description: 'Permissão alterada com sucesso.' })
  @ApiResponse({ status: 401, description: 'Não autenticado.' })
  @ApiResponse({ status: 403, description: 'Acesso restrito a administradores.' })
  @ApiResponse({ status: 404, description: 'Usuário não encontrado.' })
  async alterarRole(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AlterarRoleDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.usuarioService.alterarRole(
      id,
      dto.role,
      Number(req.user.id),
    );
  }

  // EDITAR USUÁRIO
  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  @ApiOperation({
    summary: 'Editar usuário',
    description: 'Permite que o próprio usuário ou um administrador altere os dados de uma conta.',
  })
  @ApiParam({
    name: 'id',
    description: 'Identificador do usuário.',
    example: 1,
  })
  @ApiBody({ type: UpdateUsuarioDto })
  @ApiResponse({ status: 200, description: 'Usuário atualizado com sucesso.' })
  @ApiResponse({ status: 401, description: 'Não autenticado.' })
  @ApiResponse({ status: 403, description: 'Sem permissão para alterar este usuário.' })
  @ApiResponse({ status: 404, description: 'Usuário não encontrado.' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUsuarioDto: UpdateUsuarioDto,
    @Req() req: AuthenticatedRequest,
  ) {
    if (
      req.user.id !== id &&
      req.user.role !== 'ADMIN'
    ) {
      throw new ForbiddenException(
        'Você não tem permissão para alterar este usuário!',
      );
    }

    return this.usuarioService.update(
      id,
      updateUsuarioDto,
    );
  }

  // DELETAR USUÁRIO
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Delete(':id')
  @ApiOperation({
    summary: 'Excluir usuário',
    description: 'Remove um usuário pelo seu identificador.',
  })
  @ApiParam({
    name: 'id',
    description: 'Identificador do usuário.',
    example: 1,
  })
  @ApiResponse({ status: 200, description: 'Usuário removido com sucesso.' })
  @ApiResponse({ status: 401, description: 'Não autenticado.' })
  @ApiResponse({ status: 403, description: 'Sem permissão para excluir usuários.' })
  @ApiResponse({ status: 404, description: 'Usuário não encontrado.' })
  async remove(
    @Param('id') id: string,
  ) {
    return this.usuarioService.remove(
      Number(id),
    );
  }
}
