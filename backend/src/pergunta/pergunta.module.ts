import { Module } from '@nestjs/common';
import { PerguntaService } from './pergunta.service';
import { PerguntaController } from './pergunta.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { TemaModule } from 'src/tema/tema.module';

@Module({
  imports: [PrismaModule, TemaModule],
  controllers: [PerguntaController],
  providers: [PerguntaService],
  exports: [PerguntaService]
})
export class PerguntaModule {}
