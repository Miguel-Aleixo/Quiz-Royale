import { CreateSalaDto } from './dto/create-sala.dto';
import { UpdateSalaDto } from './dto/update-sala.dto';
import { PrismaService } from "../prisma/prisma.service";
export declare class SalaService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    create(createSalaDto: CreateSalaDto): Promise<{
        id: number;
        codigo: string;
        maxJogadores: number;
        status: string;
    }>;
    findAll(): Promise<{
        id: number;
        codigo: string;
        maxJogadores: number;
        status: string;
    }[]>;
    findOne(id: number): Promise<{
        id: number;
        codigo: string;
        maxJogadores: number;
        status: string;
    } | null>;
    update(id: number, updateSalaDto: UpdateSalaDto): Promise<{
        id: number;
        codigo: string;
        maxJogadores: number;
        status: string;
    }>;
    remove(id: number): Promise<{
        id: number;
        codigo: string;
        maxJogadores: number;
        status: string;
    }>;
}
