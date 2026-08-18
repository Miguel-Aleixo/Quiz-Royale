import { PartialType } from '@nestjs/mapped-types';
import { CreateAlternativaDto } from './create-alternativa.dto';
import { IsBoolean, IsInt, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class UpdateAlternativaDto extends PartialType(CreateAlternativaDto) {

    @IsOptional()
    @IsNotEmpty({ message: 'Texto não pode ser vazio' })
    @IsString()
    texto?: string;

    @IsOptional()
    @IsNotEmpty({ message: 'Pergunta ID não pode ser vazia' })
    @IsInt()
    perguntaId?: number

    @IsOptional()
    @IsNotEmpty({ message: 'O número de jogadores não pode ser vazio!' })
    @IsBoolean({ message: 'Deve ser verdadeiro ou falso!' })
    correta?: boolean;

}
