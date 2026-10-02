import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class EmailVerificadoGuard implements CanActivate {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(
    context: ExecutionContext,
  ): Promise<boolean> {
    const request =
      context.switchToHttp().getRequest();

    const usuario = request.user;

    if (!usuario?.id) {
      throw new UnauthorizedException(
        'Usuário não autenticado.',
      );
    }

    const usuarioBanco =
      await this.prisma.usuario.findUnique({
        where: {
          id: usuario.id,
        },
        select: {
          emailVerificado: true,
        },
      });

    if (!usuarioBanco) {
      throw new UnauthorizedException(
        'Usuário não encontrado.',
      );
    }

    if (!usuarioBanco.emailVerificado) {
      throw new ForbiddenException(
        'Você precisa verificar seu e-mail para continuar.',
      );
    }

    return true;
  }
}

