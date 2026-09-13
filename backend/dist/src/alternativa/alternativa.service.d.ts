import { CreateAlternativaDto } from './dto/create-alternativa.dto';
import { UpdateAlternativaDto } from './dto/update-alternativa.dto';
import { PrismaService } from "../prisma/prisma.service";
export declare class AlternativaService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    create(createAlternativaDto: CreateAlternativaDto): Promise<{
        id: number;
        perguntaId: number;
        texto: string;
        correta: boolean;
    }>;
    findAll(): Promise<{
        id: number;
        perguntaId: number;
        texto: string;
        correta: boolean;
    }[]>;
    findOne(id: number): Promise<{
        id: number;
        perguntaId: number;
        texto: string;
        correta: boolean;
    } | null>;
    update(id: number, updateAlternativaDto: UpdateAlternativaDto): Promise<{
        id: number;
        perguntaId: number;
        texto: string;
        correta: boolean;
    }>;
    remove(id: number): Promise<{
        id: number;
        perguntaId: number;
        texto: string;
        correta: boolean;
    }>;
}
