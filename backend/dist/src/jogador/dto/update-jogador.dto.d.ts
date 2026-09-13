import { CreateJogadorDto } from './create-jogador.dto';
declare const UpdateJogadorDto_base: import("@nestjs/mapped-types").MappedType<Partial<CreateJogadorDto>>;
export declare class UpdateJogadorDto extends UpdateJogadorDto_base {
    usuarioId?: number;
    salaId?: number;
    eliminado?: boolean;
}
export {};
