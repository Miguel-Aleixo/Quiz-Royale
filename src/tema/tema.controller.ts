import { Controller, Get, Post, Body, Patch, Param, Delete, ConflictException, UseGuards } from '@nestjs/common';
import { TemaService } from './tema.service';
import { CreateTemaDto } from './dto/create-tema.dto';
import { UpdateTemaDto } from './dto/update-tema.dto';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { Roles } from 'src/auth/decorators/roles.decorators';

@Controller('tema')
export class TemaController {
  constructor(private readonly temaService: TemaService) { }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Post()
  async create(@Body() createTemaDto: CreateTemaDto) {
    const temaExiste = await this.temaService.findName(createTemaDto.nome);

    if (temaExiste) {
      return new ConflictException('Essa patente já existe!')
    };

    return this.temaService.create(createTemaDto);
  };

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Get()
  findAll() {
    return this.temaService.findAll();
  };

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Patch(':id')
  async update(@Param('id') id: string, @Body() updateTemaDto: UpdateTemaDto) {
    const TemaExiste = await this.temaService.findName(updateTemaDto.nome!);

    if (TemaExiste) {
      return new ConflictException('Esse tema já existe!')
    };

    return this.temaService.update(Number(id), updateTemaDto);
  };

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.temaService.remove(Number(id));
  };
}
