import { PartialType } from '@nestjs/mapped-types';
import { CreateSalaDto } from './create-sala.dto';
import { IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, Max, Min } from 'class-validator';
import { StatusSala } from './enumSala';

export class UpdateSalaDto extends PartialType(CreateSalaDto) {

    @IsOptional()
    @IsNotEmpty({ message: 'Nome não pode ser vazio' })
    @IsString()
    nome?: string;

    @IsOptional()
    @IsNotEmpty({ message: 'O número de jogadores não pode ser vazio!' })
    @IsInt({ message: 'O número de jogadores deve ser um número!' })
    @Min(1, { message: 'A sala deve ter pelo menos 1 jogador.' })
    @Max(50, { message: 'Uma sala não pode ter mais de 50 jogadores.' })
    maxJogadores?: number;

    @IsOptional()
    @IsNotEmpty({ message: 'Status não pode ser vazio!' })
    @IsEnum(StatusSala, {
        message: 'Status deve ser ABERTA, ANDAMENTO ou FECHADA',
    })
    status?: StatusSala;

}
