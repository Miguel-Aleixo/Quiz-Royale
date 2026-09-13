import { SalaService } from './sala.service';
import { CreateSalaDto } from './dto/create-sala.dto';
import { UpdateSalaDto } from './dto/update-sala.dto';
export declare class SalaController {
    private readonly salaService;
    constructor(salaService: SalaService);
    private gerarCodigo;
    create(createSalaDto: CreateSalaDto): Promise<{
        id: number;
        codigo: string;
        status: string;
        maxJogadores: number;
    }>;
    findAll(): Promise<{
        id: number;
        codigo: string;
        status: string;
        maxJogadores: number;
    }[]>;
    findOne(id: string): Promise<{
        id: number;
        codigo: string;
        status: string;
        maxJogadores: number;
    } | null>;
    update(id: string, updateSalaDto: UpdateSalaDto): Promise<{
        id: number;
        codigo: string;
        status: string;
        maxJogadores: number;
    }>;
    remove(id: string): Promise<{
        id: number;
        codigo: string;
        status: string;
        maxJogadores: number;
    }>;
}
