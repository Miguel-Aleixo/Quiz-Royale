
import {
    ArrayMinSize,
    IsArray,
    IsInt,
    IsBoolean,
    IsNotEmpty,
    IsString,
    Max,
    Min,
    ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

class PerguntaBancoEdicaoDto {
    @IsInt()
    @Min(1)
    perguntaId!: number;

    @IsInt()
    @Min(10)
    @Max(120)
    tempoLimite!: number;
}

class AlternativaEdicaoDto {
    @IsString()
    @IsNotEmpty({ message: 'O texto da alternativa não pode ser vazio.' })
    texto!: string;

    @IsBoolean()
    correta!: boolean;
}

class PerguntaPropriaEdicaoDto {
    @IsString()
    @IsNotEmpty({ message: 'O enunciado não pode ser vazio.' })
    enunciado!: string;

    @IsInt()
    @Min(1)
    temaId!: number;

    @IsInt()
    @Min(10)
    @Max(120)
    tempoLimite!: number;

    @IsArray()
    @ArrayMinSize(2, {
        message: 'Cada pergunta precisa ter pelo menos duas alternativas.',
    })
    @ValidateNested({ each: true })
    @Type(() => AlternativaEdicaoDto)
    alternativas!: AlternativaEdicaoDto[];
}

export class UpdateSalaEdicaoDto {
    @IsString()
    @IsNotEmpty({ message: 'O nome da sala não pode ser vazio.' })
    nome!: string;

    @IsInt()
    @Min(2)
    @Max(50)
    maxJogadores!: number;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => PerguntaBancoEdicaoDto)
    perguntasBanco!: PerguntaBancoEdicaoDto[];

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => PerguntaPropriaEdicaoDto)
    perguntasProprias!: PerguntaPropriaEdicaoDto[];
}
