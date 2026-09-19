import { IsInt, IsNotEmpty, IsString, Min } from "class-validator";

export class CreatePatenteDto {

    @IsString()
    @IsNotEmpty({ message: 'Nome da patente não pode ser vazio!' })
    nome!: string

    @IsInt()
    @Min(0)
    pontos!: number;

}
