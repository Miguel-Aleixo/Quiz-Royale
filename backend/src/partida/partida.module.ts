import { Module } from '@nestjs/common';

import { PartidaController } from './partida.controller';
import { PartidaService } from './partida.service';
import { PrismaModule } from '../prisma/prisma.module';
import { PartidaGateway } from './partida.gateway';
import { SalaModule } from '../sala/sala.module';
import { UsuarioModule } from '../usuario/usuario.module';

@Module({
  imports: [PrismaModule, SalaModule, UsuarioModule],
  controllers: [PartidaController],
  providers: [PartidaService, PartidaGateway],
})
export class PartidaModule {}