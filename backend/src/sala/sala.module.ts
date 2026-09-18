import { Module } from '@nestjs/common';
import { SalaService } from './sala.service';
import { SalaController } from './sala.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { SalaGateway } from './sala.gateway';

@Module({
  imports: [PrismaModule],
  controllers: [SalaController],
  providers: [SalaService, SalaGateway],
  exports: [SalaService]
})
export class SalaModule {}
