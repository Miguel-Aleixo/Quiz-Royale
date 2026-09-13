import { CreatePerguntaDto } from './dto/create-pergunta.dto';
import { UpdatePerguntaDto } from './dto/update-pergunta.dto';
import { PrismaService } from "../prisma/prisma.service";
export declare class PerguntaService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    create(createPerguntaDto: CreatePerguntaDto): Promise<{
        id: number;
        enunciado: string;
        temaId: number;
    }>;
    findAll(): Promise<{
        id: number;
        enunciado: string;
        temaId: number;
    }[]>;
    findOne(id: number): Promise<{
        id: number;
        enunciado: string;
        temaId: number;
    } | null>;
    update(id: number, updatePerguntaDto: UpdatePerguntaDto): Promise<{
        id: number;
        enunciado: string;
        temaId: number;
    }>;
    remove(id: number): Promise<{
        id: number;
        enunciado: string;
        temaId: number;
    }>;
}
