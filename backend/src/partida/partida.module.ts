import { Module } from '@nestjs/common';

import { PartidaController } from './partida.controller';
import { PartidaService } from './partida.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [PartidaController],
  providers: [PartidaService],
})
export class PartidaModule {}