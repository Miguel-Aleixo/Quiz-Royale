import { CreateAlternativaDto } from './create-alternativa.dto';
declare const UpdateAlternativaDto_base: import("@nestjs/mapped-types").MappedType<Partial<CreateAlternativaDto>>;
export declare class UpdateAlternativaDto extends UpdateAlternativaDto_base {
    texto?: string;
    perguntaId?: number;
    correta?: boolean;
}
export {};
