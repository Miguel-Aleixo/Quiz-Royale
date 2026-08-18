import { IsNotEmpty, IsString } from "class-validator";

export class CreateTemaDto {
    
    @IsString()
    @IsNotEmpty({ message: 'Nome do tema não pode ser vazio!' })
    nome!: string
    
}
