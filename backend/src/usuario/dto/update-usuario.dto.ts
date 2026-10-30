
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
    Matches
} from 'class-validator';

export class UpdateUsuarioDto extends PartialType(CreateUsuarioDto) {

    @IsOptional()
    @IsString()
    @IsNotEmpty({ message: 'O nome de usuário é obrigatório' })
    @MinLength(3, {
        message: 'O nome de usuário deve ter no mínimo 3 caracteres',
    })
    @MaxLength(30, {
        message: 'O nome de usuário deve ter no máximo 30 caracteres',
    })
    @Matches(/^[a-zA-Z0-9_]+$/, {
        message: 'Use apenas letras, números e underline (_), sem espaços',
    })
    nome?: string;

    @IsOptional()
    @IsNotEmpty({ message: 'Email não pode ser vazio!' })
    @IsString()
    @IsEmail({}, { message: 'Email inválido!' })
    email?: string;

    @IsOptional()
    @IsNotEmpty({ message: 'Senha não pode ser vazia!' })
    @IsString()
    @MinLength(8, {
        message: 'A senha deve ter no mínimo 8 caracteres!',
    })
    @MaxLength(128, {
        message: 'A senha deve ter no máximo 128 caracteres!',
    })
    senha?: string;

    @IsOptional()
    @IsNotEmpty({ message: 'A senha atual não pode ser vazia!' })
    @IsString()
    @MinLength(8, {
        message: 'A senha atual deve ter no mínimo 8 caracteres!',
    })
    senhaAtual?: string;

    @IsOptional()
    @IsNotEmpty({ message: 'A confirmação da senha não pode ser vazia!' })
    @IsString()
    @MinLength(8, {
        message: 'A confirmação deve ter no mínimo 8 caracteres!',
    })
    @MaxLength(128, {
        message: 'A confirmação deve ter no máximo 128 caracteres!',
    })
    confirmarSenha?: string;

    @IsOptional()
    @IsNotEmpty({ message: 'Patente é obrigatória!' })
    @IsInt({ message: 'Patente deve ser um número!' })
    patenteId?: number;
}
