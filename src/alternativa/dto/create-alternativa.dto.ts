import { IsBoolean, IsInt, IsNotEmpty, IsString } from "class-validator";

export class CreateAlternativaDto {

    @IsNotEmpty({ message: 'Texto não pode ser vazio' })
    @IsString()
    texto!: string;

    @IsNotEmpty({ message: 'Pergunta ID não pode ser vazia' })
    @IsInt()
    perguntaId!: number

    @IsNotEmpty({ message: 'O número de jogadores não pode ser vazio!' })
    @IsBoolean({ message: 'Deve ser verdadeiro ou falso!' })
    correta!: boolean;

}
