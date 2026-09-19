import { Module } from '@nestjs/common';

import { PartidaController } from './partida.controller';
import { PartidaService } from './partida.service';
import { PrismaModule } from '../prisma/prisma.module';
import { PartidaGateway } from './partida.gateway';

@Module({
  imports: [PrismaModule],
  controllers: [PartidaController],
  providers: [PartidaService, PartidaGateway],
})
export class PartidaModule {}