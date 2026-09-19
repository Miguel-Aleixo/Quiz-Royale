import { PartialType } from '@nestjs/mapped-types';
import { CreatePatenteDto } from './create-patente.dto';
import { IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';

export class UpdatePatenteDto extends PartialType(CreatePatenteDto) {

    @IsOptional()
    @IsString()
    @IsNotEmpty({ message: 'Nome da patente não pode ser vazio!' })
    nome?: string

    @IsOptional()
    @IsInt()
    @Min(0)
    pontos?: number;

}
