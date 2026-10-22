
import {
    IsInt,
    IsNotEmpty,
    IsString,
    MaxLength,
    Min,
} from "class-validator";

export class CreatePatenteDto {
    @IsString()
    @IsNotEmpty({
        message: "Nome da patente não pode ser vazio!",
    })
    @MaxLength(30, {
        message: "O nome da patente deve ter no máximo 30 caracteres!",
    })
    nome!: string;

    @IsInt({
        message: "A pontuação deve ser um número inteiro!",
    })
    @Min(1, {
        message: "A pontuação deve ser maior que zero!",
    })
    pontos!: number;
}
