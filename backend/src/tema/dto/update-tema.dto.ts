import { PartialType } from '@nestjs/mapped-types';
import { CreateTemaDto } from './create-tema.dto';
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateTemaDto extends PartialType(CreateTemaDto) {

    @IsOptional()
    @IsString()
    @IsNotEmpty({ message: 'Nome do tema não pode ser vazio!' })
    @MaxLength(30, {
        message: 'O nome do tema deve ter no máximo 30 caracteres!',
    })
    nome?: string

}
