import { CreatePerguntaDto } from './create-pergunta.dto';
declare const UpdatePerguntaDto_base: import("@nestjs/mapped-types").MappedType<Partial<CreatePerguntaDto>>;
export declare class UpdatePerguntaDto extends UpdatePerguntaDto_base {
    enunciado?: string;
    temaId?: number;
}
export {};
