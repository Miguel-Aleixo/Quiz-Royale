import {
  Controller,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';

import { PartidaService } from './partida.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

interface AuthenticatedRequest extends Request {
  user: {
    id: number;
    email: string;
    role: string;
  };
}

@Controller('partida')
export class PartidaController {
  constructor(
    private readonly partidaService: PartidaService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Post('iniciar/:codigo')
  async iniciar(
    @Param('codigo') codigo: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return await this.partidaService.iniciar(
      codigo,
      req.user.id,
    );
  }
}