import { ConflictException } from '@nestjs/common';
import { PatenteService } from './patente.service';
import { CreatePatenteDto } from './dto/create-patente.dto';
import { UpdatePatenteDto } from './dto/update-patente.dto';
export declare class PatenteController {
    private readonly patenteService;
    constructor(patenteService: PatenteService);
    create(createPatenteDto: CreatePatenteDto): Promise<{
        nome: string;
        id: number;
    } | ConflictException>;
    findAll(): Promise<{
        nome: string;
        id: number;
    }[]>;
    update(id: string, updatePatenteDto: UpdatePatenteDto): Promise<{
        nome: string;
        id: number;
    } | ConflictException>;
    remove(id: string): Promise<{
        nome: string;
        id: number;
    }>;
}
