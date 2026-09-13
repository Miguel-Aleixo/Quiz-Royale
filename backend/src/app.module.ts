import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { AuthModule } from './auth/auth.module';

import { UsuarioModule } from './usuario/usuario.module';
import { PatenteModule } from './patente/patente.module';
import { TemaModule } from './tema/tema.module';
import { PerguntaModule } from './pergunta/pergunta.module';
import { JogadorModule } from './jogador/jogador.module';
import { SalaModule } from './sala/sala.module';
import { RodadaModule } from './rodada/rodada.module';
import { AlternativaModule } from './alternativa/alternativa.module';
import { RespostaModule } from './resposta/resposta.module';

import { PrismaService } from './prisma/prisma.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    AuthModule,

    UsuarioModule,
    PatenteModule,
    TemaModule,
    PerguntaModule,
    JogadorModule,
    SalaModule,
    RodadaModule,
    AlternativaModule,
    RespostaModule,
  ],

  providers: [
    PrismaService,
  ],
})
export class AppModule {}