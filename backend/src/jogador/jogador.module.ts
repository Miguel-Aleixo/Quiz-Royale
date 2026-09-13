import { Module } from '@nestjs/common';
import { JogadorService } from './jogador.service';
import { JogadorController } from './jogador.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { UsuarioModule } from '../usuario/usuario.module';
import { SalaModule } from '../sala/sala.module';

@Module({
  imports: [PrismaModule, UsuarioModule, SalaModule],
  controllers: [JogadorController],
  providers: [JogadorService],
  exports: [JogadorService]
})
export class JogadorModule {}
