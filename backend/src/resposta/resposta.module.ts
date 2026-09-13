import { Module } from '@nestjs/common';
import { RespostaService } from './resposta.service';
import { RespostaController } from './resposta.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { AlternativaModule } from '../alternativa/alternativa.module';
import { JogadorModule } from '../jogador/jogador.module';

@Module({
  imports: [PrismaModule, AlternativaModule, JogadorModule],
  controllers: [RespostaController],
  providers: [RespostaService],
})
export class RespostaModule {}
