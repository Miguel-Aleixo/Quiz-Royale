import { Module } from '@nestjs/common';
import { RespostaService } from './resposta.service';
import { RespostaController } from './resposta.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { AlternativaModule } from 'src/alternativa/alternativa.module';
import { JogadorModule } from 'src/jogador/jogador.module';

@Module({
  imports: [PrismaModule, AlternativaModule, JogadorModule],
  controllers: [RespostaController],
  providers: [RespostaService],
})
export class RespostaModule {}
