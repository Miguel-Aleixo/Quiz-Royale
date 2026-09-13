import { CreateRodadaDto } from './dto/create-rodada.dto';
import { UpdateRodadaDto } from './dto/update-rodada.dto';
import { PrismaService } from "../prisma/prisma.service";
export declare class RodadaService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    create(createRodadaDto: CreateRodadaDto): Promise<{
        id: number;
        salaId: number;
        perguntaId: number;
        tempoLimite: number;
    }>;
    findAll(): Promise<{
        id: number;
        salaId: number;
        perguntaId: number;
        tempoLimite: number;
    }[]>;
    findOne(id: number): Promise<{
        id: number;
        salaId: number;
        perguntaId: number;
        tempoLimite: number;
    } | null>;
    update(id: number, updateRodadaDto: UpdateRodadaDto): Promise<{
        id: number;
        salaId: number;
        perguntaId: number;
        tempoLimite: number;
    }>;
    remove(id: number): Promise<{
        id: number;
        salaId: number;
        perguntaId: number;
        tempoLimite: number;
    }>;
}
