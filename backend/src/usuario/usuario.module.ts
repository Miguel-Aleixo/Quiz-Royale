import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';

import { UsuarioService } from './usuario.service';
import { UsuarioController } from './usuario.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { EmailModule } from '../email/email.module';

@Module({
  imports: [
    PrismaModule, EmailModule,

    PassportModule.register({
      defaultStrategy: 'jwt',
    }),
  ],

  controllers: [
    UsuarioController,
  ],

  providers: [
    UsuarioService,
  ],

  exports: [
    UsuarioService,
  ],
})
export class UsuarioModule {}