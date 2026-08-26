import { Controller, Get, Post, Body, Patch, Param, Delete, ConflictException, UseGuards } from '@nestjs/common';
import { UsuarioService } from './usuario.service';
import { CreateUsuarioDto } from './dto/create-usuario.dto';
import { UpdateUsuarioDto } from './dto/update-usuario.dto';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';

@Controller('usuario')
export class UsuarioController {
  constructor(private readonly usuarioService: UsuarioService) { }

  @Post()
  async create(@Body() createUsuarioDto: CreateUsuarioDto) {
    const emailExiste = await this.usuarioService.findByEmail(createUsuarioDto.email);

    if (emailExiste) {
      return new ConflictException('Esse email já está sendo usado!')
    };

    return this.usuarioService.create(createUsuarioDto);
  }

  @Post('/admin')
  async createAdmin(@Body() createUsuarioDto: CreateUsuarioDto) {
    const emailExiste = await this.usuarioService.findByEmail(createUsuarioDto.email);

    if (emailExiste) {
      return new ConflictException('Esse email já está sendo usado!')
    };

    return this.usuarioService.create(createUsuarioDto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get()
  async findAll() {
    return this.usuarioService.findAll();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Patch(':id')
  async update(@Param('id') id: string, @Body() updateUsuarioDto: UpdateUsuarioDto) {
    const emailExiste = await this.usuarioService.findByEmail(updateUsuarioDto.email!);

    if (emailExiste) {
      return new ConflictException('Esse email já está sendo usado!')
    };

    return this.usuarioService.update(Number(id), updateUsuarioDto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.usuarioService.remove(Number(id));
  }
}
