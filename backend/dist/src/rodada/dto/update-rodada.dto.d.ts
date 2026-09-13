import { CreateRodadaDto } from './create-rodada.dto';
declare const UpdateRodadaDto_base: import("@nestjs/mapped-types").MappedType<Partial<CreateRodadaDto>>;
export declare class UpdateRodadaDto extends UpdateRodadaDto_base {
    perguntaId?: number;
    salaId?: number;
    tempoLimite?: number;
}
export {};
