
import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';

// MODULO
import { UsuarioController } from './usuario.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { EmailModule } from '../email/email.module';

// SERVICE
import { UsuarioService } from './usuario.service';

// GATEWAY
import { UsuarioGateway } from './usuario.gateway';


@Module({
  imports: [
    PrismaModule,
    EmailModule,

    PassportModule.register({
      defaultStrategy: 'jwt',
    }),
  ],

  controllers: [
    UsuarioController,
  ],

  providers: [
    UsuarioService,
    UsuarioGateway,
  ],

  exports: [
    UsuarioService,
  ],
})
export class UsuarioModule {}
