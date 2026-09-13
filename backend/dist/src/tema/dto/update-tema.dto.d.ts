import { CreateTemaDto } from './create-tema.dto';
declare const UpdateTemaDto_base: import("@nestjs/mapped-types").MappedType<Partial<CreateTemaDto>>;
export declare class UpdateTemaDto extends UpdateTemaDto_base {
    nome?: string;
}
export {};
