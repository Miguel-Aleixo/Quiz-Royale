import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateTemaDto {
  @IsString()
  @IsNotEmpty({ message: 'Nome do tema não pode ser vazio!' })
  @MaxLength(30, {
    message: 'O nome do tema deve ter no máximo 30 caracteres!',
  })
  nome!: string;
}