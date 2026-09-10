import { PartialType } from '@nestjs/mapped-types';
import { CreateTemaDto } from './create-tema.dto';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class UpdateTemaDto extends PartialType(CreateTemaDto) {

    @IsOptional()
    @IsString()
    @IsNotEmpty({ message: 'Nome do tema não pode ser vazio!' })
    nome?: string

}
