import { IsBoolean, IsInt, IsNotEmpty } from 'class-validator';

export class CreateJogadorDto {
  @IsNotEmpty({ message: 'Usuário ID não pode ser vazio!' })
  @IsInt({ message: 'Usuário ID deve ser um número!' })
  usuarioId!: number;

  @IsNotEmpty({ message: 'Sala ID não pode ser vazio!' })
  @IsInt({ message: 'Sala ID deve ser um número!' })
  salaId!: number;

  @IsNotEmpty({ message: 'Eliminado não pode ser vazio!' })
  @IsBoolean({ message: 'Eliminado deve ser verdadeiro ou falso!' })
  eliminado!: boolean;
}