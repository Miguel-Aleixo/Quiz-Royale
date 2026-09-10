import { PartialType } from '@nestjs/mapped-types';
import { CreateJogadorDto } from './create-jogador.dto';
import { IsBoolean, IsInt, IsNotEmpty, IsOptional } from 'class-validator';

export class UpdateJogadorDto extends PartialType(CreateJogadorDto) {

    @IsOptional()
    @IsNotEmpty({ message: 'Usuário ID não pode ser vazio!' })
    @IsInt({ message: 'Usuário ID deve ser um número!' })
    usuarioId?: number;

    @IsOptional()
    @IsNotEmpty({ message: 'Sala ID não pode ser vazio!' })
    @IsInt({ message: 'Sala ID deve ser um número!' })
    salaId?: number;

    @IsOptional()
    @IsNotEmpty({ message: 'Eliminado não pode ser vazio!' })
    @IsBoolean({ message: 'Eliminado deve ser verdadeiro ou falso!' })
    eliminado?: boolean;

}
