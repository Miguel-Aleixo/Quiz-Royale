import { Module } from '@nestjs/common';
import { RodadaService } from './rodada.service';
import { RodadaController } from './rodada.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { PerguntaModule } from 'src/pergunta/pergunta.module';
import { SalaModule } from 'src/sala/sala.module';

@Module({
  imports: [PrismaModule, PerguntaModule, SalaModule],
  controllers: [RodadaController],
  providers: [RodadaService],
})
export class RodadaModule {}
