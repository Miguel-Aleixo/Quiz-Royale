import { CreateRespostaDto } from './create-resposta.dto';
declare const UpdateRespostaDto_base: import("@nestjs/mapped-types").MappedType<Partial<CreateRespostaDto>>;
export declare class UpdateRespostaDto extends UpdateRespostaDto_base {
    JogadorId?: number;
    alternativaId?: number;
    tempoResposta?: number;
}
export {};
