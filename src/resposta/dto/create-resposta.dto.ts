import { IsInt, IsNotEmpty } from "class-validator";

export class CreateRespostaDto {

    @IsNotEmpty({ message: 'Jogador ID não pode ser vazia' })
    @IsInt()
    jogadorId!: number

    @IsNotEmpty({ message: 'Alternativa ID não pode ser vazia' })
    @IsInt()
    alternativaId!: number

    @IsNotEmpty({ message: 'O tempo da resposta não pode ser vazio!' })
    @IsInt({ message: 'Deve ser em segundos!' })
    tempoResposta!: number;

}
