import { IsNotEmpty, IsString } from "class-validator";

export class CreatePatenteDto {

    @IsString()
    @IsNotEmpty({message: 'Nome da patente não pode ser vazio!'})
    nome!: string

}
