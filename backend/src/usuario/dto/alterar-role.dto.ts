import { IsEnum, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Role } from '@prisma/client';

export class AlterarRoleDto {

    @ApiProperty({
        description: 'Nova função do usuário',
        enum: Role,
        example: Role.JOGADOR,
    })
    @IsNotEmpty({
        message: 'A função não pode ser vazia!',
    })
    @IsEnum(Role, {
        message: 'A função deve ser ADMIN ou JOGADOR.',
    })
    role!: Role;
}
