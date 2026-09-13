import { CreatePatenteDto } from './create-patente.dto';
declare const UpdatePatenteDto_base: import("@nestjs/mapped-types").MappedType<Partial<CreatePatenteDto>>;
export declare class UpdatePatenteDto extends UpdatePatenteDto_base {
    nome?: string;
}
export {};
