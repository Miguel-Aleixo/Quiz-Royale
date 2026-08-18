import { IsEmail, IsInt, IsNotEmpty, IsString, MinLength } from "class-validator";

export class CreateUsuarioDto {

    @IsNotEmpty({ message: 'Nome não pode ser vazio!' })
    @IsString()
    nome!: string

    @IsNotEmpty({ message: 'Email não pode ser vazio!' })
    @IsEmail({}, { message: 'Email invalido' })
    email!: string

    @IsNotEmpty({ message: 'Senha não pode ser vazia!' })
    @IsString()
    @MinLength(8, { message: 'A senha deve ter no minimo 8 carecteres!' })
    senha!: string

    @IsNotEmpty({ message: 'Patente é obrigatória!' })
    @IsInt({ message: 'Patente deve ser um número!' })
    patenteId!: number;
}
