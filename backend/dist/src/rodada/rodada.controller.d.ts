import { ConflictException } from '@nestjs/common';
import { RodadaService } from './rodada.service';
import { CreateRodadaDto } from './dto/create-rodada.dto';
import { UpdateRodadaDto } from './dto/update-rodada.dto';
import { PerguntaService } from "../pergunta/pergunta.service";
import { SalaService } from "../sala/sala.service";
export declare class RodadaController {
    private readonly rodadaService;
    private readonly perguntaService;
    private readonly salaService;
    constructor(rodadaService: RodadaService, perguntaService: PerguntaService, salaService: SalaService);
    create(createRodadaDto: CreateRodadaDto): Promise<ConflictException | {
        id: number;
        salaId: number;
        tempoLimite: number;
        perguntaId: number;
    }>;
    findAll(): Promise<{
        id: number;
        salaId: number;
        tempoLimite: number;
        perguntaId: number;
    }[]>;
    update(id: string, updateRodadaDto: UpdateRodadaDto): Promise<ConflictException | {
        id: number;
        salaId: number;
        tempoLimite: number;
        perguntaId: number;
    }>;
    remove(id: string): Promise<{
        id: number;
        salaId: number;
        tempoLimite: number;
        perguntaId: number;
    }>;
}
