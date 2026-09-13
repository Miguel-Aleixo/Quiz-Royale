import { ConflictException } from '@nestjs/common';
import { TemaService } from './tema.service';
import { CreateTemaDto } from './dto/create-tema.dto';
import { UpdateTemaDto } from './dto/update-tema.dto';
export declare class TemaController {
    private readonly temaService;
    constructor(temaService: TemaService);
    create(createTemaDto: CreateTemaDto): Promise<ConflictException | {
        id: number;
        nome: string;
    }>;
    findAll(): Promise<{
        id: number;
        nome: string;
    }[]>;
    update(id: string, updateTemaDto: UpdateTemaDto): Promise<ConflictException | {
        id: number;
        nome: string;
    }>;
    remove(id: string): Promise<{
        id: number;
        nome: string;
    }>;
}
