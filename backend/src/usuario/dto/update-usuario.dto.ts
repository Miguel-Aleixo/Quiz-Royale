import { PartialType } from '@nestjs/mapped-types';
import { CreateUsuarioDto } from './create-usuario.dto';
import {
    IsEmail,
    IsInt,
    IsNotEmpty,
    IsOptional,
    IsString,
    MinLength,
    MaxLength,
    Matches,
} from 'class-validator';

export class UpdateUsuarioDto extends PartialType(CreateUsuarioDto) {

    // NOME DE USUÁRIO
    @IsOptional()
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
    nome?: string;

    // EMAIL
    @IsOptional()
    @IsString()
    @IsNotEmpty({ message: 'O e-mail não pode ser vazio!' })
    @IsEmail({}, { message: 'Informe um e-mail válido!' })
    @MaxLength(70, {
        message: 'O e-mail deve ter no máximo 70 caracteres!',
    })
    email?: string;

    // SENHA
    @IsOptional()
    @IsString()
    @IsNotEmpty({ message: 'A senha não pode ser vazia!' })
    @MinLength(8, {
        message: 'A senha deve ter no mínimo 8 caracteres!',
    })
    @MaxLength(20, {
        message: 'A senha deve ter no máximo 20 caracteres!',
    })
    senha?: string;

    // SENHA ATUAL
    @IsOptional()
    @IsString()
    @IsNotEmpty({ message: 'A senha atual não pode ser vazia!' })
    @MinLength(8, {
        message: 'A senha atual deve ter no mínimo 8 caracteres!',
    })
    @MaxLength(128, {
        message: 'A senha atual deve ter no máximo 128 caracteres!',
    })
    senhaAtual?: string;

    // CONFIRMAÇÃO DA SENHA
    @IsOptional()
    @IsString()
    @IsNotEmpty({ message: 'A confirmação da senha não pode ser vazia!' })
    @MinLength(8, {
        message: 'A confirmação deve ter no mínimo 8 caracteres!',
    })
    @MaxLength(20, {
        message: 'A confirmação deve ter no máximo 20 caracteres!',
    })
    confirmarSenha?: string;

    // PATENTE
    @IsOptional()
    @IsInt({ message: 'A patente deve ser um número!' })
    patenteId?: number;
}
