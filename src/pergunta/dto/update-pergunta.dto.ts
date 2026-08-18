import { PartialType } from '@nestjs/mapped-types';
import { CreatePerguntaDto } from './create-pergunta.dto';
import { IsInt, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class UpdatePerguntaDto extends PartialType(CreatePerguntaDto) {

    @IsOptional()
    @IsString()
    @IsNotEmpty({ message: 'O enunciado não pode ser vazio!' })
    enunciado?: string

    @IsOptional()
    @IsNotEmpty({ message: 'Tema é obrigatório!' })
    @IsInt({ message: 'Tema deve ser um número!' })
    temaId?: number;

}
