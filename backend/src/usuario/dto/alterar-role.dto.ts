import { IsEnum } from 'class-validator';
import { Role } from '@prisma/client';

export class AlterarRoleDto {
  @IsEnum(Role, {
    message: 'A função deve ser ADMIN ou JOGADOR.',
  })
  role: Role;
}