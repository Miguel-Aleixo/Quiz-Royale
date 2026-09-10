import { PartialType } from '@nestjs/mapped-types';
import { CreateUsuarioDto } from './create-usuario.dto';
import { IsEmail, IsInt, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

export class UpdateUsuarioDto extends PartialType(CreateUsuarioDto) {

    @IsOptional()
    @IsNotEmpty({ message: 'Nome não pode ser vazio!' })
    @IsString()
    nome?: string

    @IsOptional()
    @IsNotEmpty({ message: 'Email não pode ser vazio!' })
    @IsString()
    @IsEmail({}, { message: 'Email invalido' })
    email?: string

    @IsOptional()
    @IsNotEmpty({ message: 'Senha não pode ser vazia!' })
    @IsString()
    @MinLength(8, { message: 'A senha deve ter no minimo 8 carecteres!' })
    senha?: string

    @IsOptional()
    @IsNotEmpty({ message: 'Patente é obrigatória!' })
    @IsInt({ message: 'Patente deve ser um número!' })
    patenteId?: number;

}
