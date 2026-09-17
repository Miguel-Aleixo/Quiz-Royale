import {
  IsNotEmpty,
  IsString,
  MaxLength,
} from 'class-validator';

export class EntrarSalaDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(6)
  codigo: string;
}