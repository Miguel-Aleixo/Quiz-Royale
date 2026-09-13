import { ConflictException } from '@nestjs/common';
import { RespostaService } from './resposta.service';
import { CreateRespostaDto } from './dto/create-resposta.dto';
import { UpdateRespostaDto } from './dto/update-resposta.dto';
import { AlternativaService } from "../alternativa/alternativa.service";
import { JogadorService } from "../jogador/jogador.service";
export declare class RespostaController {
    private readonly respostaService;
    private readonly alternativaService;
    private readonly jogadorService;
    constructor(respostaService: RespostaService, alternativaService: AlternativaService, jogadorService: JogadorService);
    create(createRespostaDto: CreateRespostaDto): Promise<ConflictException | {
        id: number;
        tempoResposta: number;
        jogadorId: number;
        alternativaId: number;
    }>;
    findAll(): Promise<{
        id: number;
        tempoResposta: number;
        jogadorId: number;
        alternativaId: number;
    }[]>;
    findOne(id: string): Promise<{
        id: number;
        tempoResposta: number;
        jogadorId: number;
        alternativaId: number;
    } | null>;
    update(id: string, updateRespostaDto: UpdateRespostaDto): Promise<ConflictException | {
        id: number;
        tempoResposta: number;
        jogadorId: number;
        alternativaId: number;
    }>;
    remove(id: string): Promise<{
        id: number;
        tempoResposta: number;
        jogadorId: number;
        alternativaId: number;
    }>;
}
