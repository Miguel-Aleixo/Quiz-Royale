import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { UsuarioModule } from './usuario/usuario.module';
import { PatenteModule } from './patente/patente.module';
import { PrismaService } from './prisma/prisma.service';
import { TemaModule } from './tema/tema.module';
import { PerguntaModule } from './pergunta/pergunta.module';
import { JogadorModule } from './jogador/jogador.module';
import { SalaModule } from './sala/sala.module';
import { RodadaModule } from './rodada/rodada.module';
import { AlternativaModule } from './alternativa/alternativa.module';
import { RespostaModule } from './resposta/resposta.module';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    UsuarioModule,
    PatenteModule,
    TemaModule,
    PerguntaModule,
    JogadorModule,
    SalaModule,
    RodadaModule,
    AlternativaModule,
    RespostaModule,
    AuthModule,
  ],

  providers: [PrismaService],
})
export class AppModule {}