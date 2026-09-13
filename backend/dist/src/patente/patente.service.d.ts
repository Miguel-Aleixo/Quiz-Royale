import { CreatePatenteDto } from './dto/create-patente.dto';
import { UpdatePatenteDto } from './dto/update-patente.dto';
import { PrismaService } from "../prisma/prisma.service";
export declare class PatenteService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    create(createPatenteDto: CreatePatenteDto): Promise<{
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
    update(id: number, updatePatenteDto: UpdatePatenteDto): Promise<{
        nome: string;
        id: number;
    }>;
    remove(id: number): Promise<{
        nome: string;
        id: number;
    }>;
}
