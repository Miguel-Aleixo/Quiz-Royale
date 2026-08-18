import { Module } from '@nestjs/common';
import { PatenteService } from './patente.service';
import { PatenteController } from './patente.controller';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [PatenteController],
  providers: [PatenteService],
})
export class PatenteModule { }
