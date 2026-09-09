import { Controller, Get, Post, Body, Patch, Param, Delete, ConflictException, UseGuards } from '@nestjs/common';
import { PatenteService } from './patente.service';
import { CreatePatenteDto } from './dto/create-patente.dto';
import { UpdatePatenteDto } from './dto/update-patente.dto';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { Roles } from 'src/auth/decorators/roles.decorators';

@Controller('patente')
export class PatenteController {
  constructor(private readonly patenteService: PatenteService) { }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Post()
  async create(@Body() createPatenteDto: CreatePatenteDto) {
    const patenteExiste = await this.patenteService.findName(createPatenteDto.nome);

    if (patenteExiste) {
      throw new ConflictException('Essa patente já existe!')
    };

    return this.patenteService.create(createPatenteDto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Get()
  async findAll() {
    return this.patenteService.findAll();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Patch(':id')
  async update(@Param('id') id: string, @Body() updatePatenteDto: UpdatePatenteDto) {

    const patenteId = Number(id);

    if (updatePatenteDto.nome) {
      const patenteExiste = await this.patenteService.findName(updatePatenteDto.nome)

      if (patenteExiste && patenteExiste.id !== patenteId) {
        throw new ConflictException('Essa patente já existe!');
      }
    }

    return this.patenteService.update(patenteId,updatePatenteDto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.patenteService.remove(Number(id));
  }
}
