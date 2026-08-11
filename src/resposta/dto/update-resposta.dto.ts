import { PartialType } from '@nestjs/mapped-types';
import { CreateRespostaDto } from './create-resposta.dto';
import { IsInt, IsNotEmpty, IsOptional } from 'class-validator';

export class UpdateRespostaDto extends PartialType(CreateRespostaDto) {

    @IsOptional()
    @IsNotEmpty({ message: 'Jogador ID não pode ser vazia' })
    @IsInt()
    JogadorId?: number

    @IsOptional()
    @IsNotEmpty({ message: 'Alternativa ID não pode ser vazia' })
    @IsInt()
    alternativaId?: number

    @IsOptional()
    @IsNotEmpty({ message: 'O tempo da resposta não pode ser vazio!' })
    @IsInt({ message: 'Deve ser em segundos!' })
    tempoResposta?: number;

}
