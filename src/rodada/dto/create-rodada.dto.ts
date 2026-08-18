import { IsInt, IsNotEmpty, Max, Min } from "class-validator";

export class CreateRodadaDto {

    @IsNotEmpty({ message: 'Pergunta ID não pode ser vazio!' })
    @IsInt({ message: 'Pergunta ID deve ser um número!' })
    perguntaId!: number;

    @IsNotEmpty({ message: 'Sala ID não pode ser vazio!' })
    @IsInt({ message: 'Sala ID deve ser um número!' })
    salaId!: number;

    @IsNotEmpty({ message: 'O tempo limite não pode ser vazio!' })
    @IsInt({ message: 'Tempo limite deve ser um número!' })
    @Min(10, { message: 'O tempo limite deve ter pelo menos 10 segundos.' })
    @Max(120, { message: 'O tempo limite  não pode ter mais de 120 segundos.' })
    tempoLimite!: number

}
