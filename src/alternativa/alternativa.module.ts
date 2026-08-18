import { Module } from '@nestjs/common';
import { AlternativaService } from './alternativa.service';
import { AlternativaController } from './alternativa.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { PerguntaModule } from 'src/pergunta/pergunta.module';

@Module({
  imports: [PrismaModule, PerguntaModule],
  controllers: [AlternativaController],
  providers: [AlternativaService],
  exports: [AlternativaService]
})
export class AlternativaModule {}
