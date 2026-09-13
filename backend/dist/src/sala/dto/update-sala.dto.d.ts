import { CreateSalaDto } from './create-sala.dto';
import { StatusSala } from './enumSala';
declare const UpdateSalaDto_base: import("@nestjs/mapped-types").MappedType<Partial<CreateSalaDto>>;
export declare class UpdateSalaDto extends UpdateSalaDto_base {
    nome?: string;
    maxJogadores?: number;
    status?: StatusSala;
}
export {};
