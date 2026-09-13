import { CreateRespostaDto } from './dto/create-resposta.dto';
import { UpdateRespostaDto } from './dto/update-resposta.dto';
import { PrismaService } from "../prisma/prisma.service";
export declare class RespostaService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    create(createRespostaDto: CreateRespostaDto): Promise<{
        id: number;
        jogadorId: number;
        alternativaId: number;
        tempoResposta: number;
    }>;
    findAll(): Promise<{
        id: number;
        jogadorId: number;
        alternativaId: number;
        tempoResposta: number;
    }[]>;
    findOne(id: number): Promise<{
        id: number;
        jogadorId: number;
        alternativaId: number;
        tempoResposta: number;
    } | null>;
    update(id: number, updateRespostaDto: UpdateRespostaDto): Promise<{
        id: number;
        jogadorId: number;
        alternativaId: number;
        tempoResposta: number;
    }>;
    remove(id: number): Promise<{
        id: number;
        jogadorId: number;
        alternativaId: number;
        tempoResposta: number;
    }>;
}
