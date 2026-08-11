import { PartialType } from '@nestjs/mapped-types';
import { CreateRodadaDto } from './create-rodada.dto';
import { IsInt, IsNotEmpty, IsOptional, Max, Min } from 'class-validator';

export class UpdateRodadaDto extends PartialType(CreateRodadaDto) {

    @IsOptional()
    @IsNotEmpty({ message: 'Pergunta ID não pode ser vazio!' })
    @IsInt({ message: 'Pergunta ID deve ser um número!' })
    perguntaId?: number;

    @IsOptional()
    @IsNotEmpty({ message: 'Sala ID não pode ser vazio!' })
    @IsInt({ message: 'Sala ID deve ser um número!' })
    salaId?: number;

    @IsOptional()
    @IsNotEmpty({ message: 'O tempo limite não pode ser vazio!' })
    @IsInt({ message: 'Tempo limite deve ser um número!' })
    @Min(10, { message: 'O tempo limite deve ter pelo menos 10 segundos.' })
    @Max(120, { message: 'O tempo limite  não pode ter mais de 120 segundos.' })
    tempoLimite?: number

}
