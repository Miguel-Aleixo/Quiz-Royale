import { IsInt, IsNotEmpty, IsString } from "class-validator";

export class CreatePerguntaDto {

    @IsString()
    @IsNotEmpty({ message: 'O enunciado não pode ser vazio!' })
    enunciado!: string

    @IsNotEmpty({ message: 'Tema é obrigatório!' })
    @IsInt({ message: 'Tema deve ser um número!' })
    temaId!: number;

}
