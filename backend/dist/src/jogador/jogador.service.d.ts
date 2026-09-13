import { CreateJogadorDto } from './dto/create-jogador.dto';
import { UpdateJogadorDto } from './dto/update-jogador.dto';
import { PrismaService } from "../prisma/prisma.service";
export declare class JogadorService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    create(createJogadorDto: CreateJogadorDto): Promise<{
        id: number;
        usuarioId: number;
        salaId: number;
        eliminado: boolean;
    }>;
    findAll(): Promise<{
        id: number;
        usuarioId: number;
        salaId: number;
        eliminado: boolean;
    }[]>;
    findOne(id: number): Promise<{
        id: number;
        usuarioId: number;
        salaId: number;
        eliminado: boolean;
    } | null>;
    update(id: number, updateJogadorDto: UpdateJogadorDto): Promise<{
        id: number;
        usuarioId: number;
        salaId: number;
        eliminado: boolean;
    }>;
    remove(id: number): Promise<{
        id: number;
        usuarioId: number;
        salaId: number;
        eliminado: boolean;
    }>;
}
