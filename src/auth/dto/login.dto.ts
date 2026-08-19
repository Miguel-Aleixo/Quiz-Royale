import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @IsEmail({}, { message: 'Informe um email válido' })
  @IsNotEmpty({ message: 'O email é obrigatório' })
  email!: string;

  @IsString({ message: 'A senha deve ser um texto' })
  @IsNotEmpty({ message: 'A senha é obrigatória' })
  @MinLength(6, { message: 'A senha deve ter no mínimo 8 caracteres' })
  senha!: string;
}