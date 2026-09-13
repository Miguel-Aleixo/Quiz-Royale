import { CreateTemaDto } from './dto/create-tema.dto';
import { UpdateTemaDto } from './dto/update-tema.dto';
import { PrismaService } from "../prisma/prisma.service";
export declare class TemaService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    create(createTemaDto: CreateTemaDto): Promise<{
        nome: string;
        id: number;
    }>;
    findAll(): Promise<{
        nome: string;
        id: number;
    }[]>;
    findName(nome: string): Promise<{
        nome: string;
        id: number;
    } | null>;
    findOne(id: number): Promise<{
        nome: string;
        id: number;
    } | null>;
    update(id: number, updateTemaDto: UpdateTemaDto): Promise<{
        nome: string;
        id: number;
    }>;
    remove(id: number): Promise<{
        nome: string;
        id: number;
    }>;
}
