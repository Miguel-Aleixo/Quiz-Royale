import { Controller, Get, Post, Body, Patch, Param, Delete, ConflictException } from '@nestjs/common';
import { JogadorService } from './jogador.service';
import { CreateJogadorDto } from './dto/create-jogador.dto';
import { UpdateJogadorDto } from './dto/update-jogador.dto';
import { UsuarioService } from 'src/usuario/usuario.service';
import { SalaService } from 'src/sala/sala.service';

@Controller('jogador')
export class JogadorController {
  constructor(
    private readonly jogadorService: JogadorService,
    private readonly usuarioService: UsuarioService,
    private readonly salaService: SalaService
  ) { }

  @Post()
  async create(@Body() createJogadorDto: CreateJogadorDto) {
    const usuarioExiste = await this.usuarioService.findOne(createJogadorDto.usuarioId);
    const salaExiste = await this.salaService.findOne(createJogadorDto.salaId);

    if (!usuarioExiste) {
      return new ConflictException('Esse usuario não existe!')
    }

    if (!salaExiste) {
      return new ConflictException('Essa sala não existe!')
    }

    return this.jogadorService.create(createJogadorDto);
  }

  @Get()
  findAll() {
    return this.jogadorService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.jogadorService.findOne(Number(id));
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() updateJogadorDto: UpdateJogadorDto) {
    const usuarioExiste = await this.usuarioService.findOne(updateJogadorDto.usuarioId!);
    const salaExiste = await this.salaService.findOne(updateJogadorDto.salaId!);

    if (!usuarioExiste) {
      return new ConflictException('Esse usuario não existe!')
    }

    if (!salaExiste) {
      return new ConflictException('Essa sala não existe!')
    }

    return this.jogadorService.update(Number(id), updateJogadorDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.jogadorService.remove(Number(id));
  }
}
