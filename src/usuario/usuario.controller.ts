import { Controller, Get, Post, Body, Patch, Param, Delete, ConflictException } from '@nestjs/common';
import { UsuarioService } from './usuario.service';
import { CreateUsuarioDto } from './dto/create-usuario.dto';
import { UpdateUsuarioDto } from './dto/update-usuario.dto';

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

  @Get()
  async findAll() {
    return this.usuarioService.findAll();
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() updateUsuarioDto: UpdateUsuarioDto) {
    const emailExiste = await this.usuarioService.findByEmail(updateUsuarioDto.email!);

    if (emailExiste) {
      return new ConflictException('Esse email já está sendo usado!')
    };

    return this.usuarioService.update(Number(id), updateUsuarioDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.usuarioService.remove(Number(id));
  }
}
