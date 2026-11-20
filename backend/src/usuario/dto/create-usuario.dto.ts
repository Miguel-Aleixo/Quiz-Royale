import {
    IsEmail,
    IsInt,
    IsNotEmpty,
    IsString,
    MinLength,
    IsOptional,
    Matches,
    MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateUsuarioDto {

    // NOME DE USUÁRIO
    @ApiProperty({
        description: 'Nome de usuário (3 a 30 caracteres)',
        example: 'miguel_123',
        minLength: 3,
        maxLength: 30,
    })
    @IsString()
    @IsNotEmpty({ message: 'O nome de usuário é obrigatório!' })
    @MinLength(3, {
        message: 'O nome de usuário deve ter no mínimo 3 caracteres!',
    })
    @MaxLength(30, {
        message: 'O nome de usuário deve ter no máximo 30 caracteres!',
    })
    @Matches(/^[a-zA-Z0-9_]+$/, {
        message: 'Use apenas letras, números e underline (_), sem espaços!',
    })
    nome!: string;

    // EMAIL
    @ApiProperty({
        description: 'E-mail do usuário',
        example: 'miguel@email.com',
        maxLength: 70,
    })
    @IsString()
    @IsNotEmpty({ message: 'O e-mail não pode ser vazio!' })
    @IsEmail({}, { message: 'Informe um e-mail válido!' })
    @MaxLength(70, {
        message: 'O e-mail deve ter no máximo 70 caracteres!',
    })
    email!: string;

    // SENHA
    @ApiProperty({
        description: 'Senha do usuário (mínimo de 8 e máximo de 20 caracteres)',
        example: 'Senha123',
        minLength: 8,
        maxLength: 20,
    })
    @IsString()
    @IsNotEmpty({ message: 'A senha não pode ser vazia!' })
    @MinLength(8, {
        message: 'A senha deve ter no mínimo 8 caracteres!',
    })
    @MaxLength(20, {
        message: 'A senha deve ter no máximo 20 caracteres!',
    })
    senha!: string;

    // PATENTE
    @ApiPropertyOptional({
        description: 'Identificador da patente',
        example: 1,
        type: Number,
    })
    @IsOptional()
    @IsInt({ message: 'A patente deve ser um número!' })
    patenteId!: number;
}
