import {
  IsNotEmpty,
  IsString,
  MinLength,
} from 'class-validator';

export class LoginDto {
  @IsString({ message: 'Informe um email ou nome de usuário válido' })
  @IsNotEmpty({ message: 'O email ou nome de usuário é obrigatório' })
  email!: string;

  @IsString({ message: 'A senha deve ser um texto' })
  @IsNotEmpty({ message: 'A senha é obrigatória' })
  @MinLength(8, {
    message: 'A senha deve ter no mínimo 8 caracteres',
  })
  senha!: string;
}