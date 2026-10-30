import { IsEmail, IsInt, IsNotEmpty, IsString, MinLength, IsOptional, Matches, MaxLength } from "class-validator";

export class CreateUsuarioDto {

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
    nome!: string;

    @IsNotEmpty({ message: 'Email não pode ser vazio!' })
    @IsEmail({}, { message: 'Email invalido' })
    email!: string

    @IsNotEmpty({ message: 'Senha não pode ser vazia!' })
    @IsString()
    @MinLength(8, { message: 'A senha deve ter no minimo 8 carecteres!' })
    senha!: string

    @IsOptional()
    @IsNotEmpty({ message: 'Patente é obrigatória!' })
    @IsInt({ message: 'Patente deve ser um número!' })
    patenteId!: number;
}
