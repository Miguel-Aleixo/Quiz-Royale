import { ConflictException } from '@nestjs/common';
import { PerguntaService } from './pergunta.service';
import { CreatePerguntaDto } from './dto/create-pergunta.dto';
import { UpdatePerguntaDto } from './dto/update-pergunta.dto';
import { TemaService } from "../tema/tema.service";
export declare class PerguntaController {
    private readonly perguntaService;
    private readonly temaService;
    constructor(perguntaService: PerguntaService, temaService: TemaService);
    create(createPerguntaDto: CreatePerguntaDto): Promise<ConflictException | {
        id: number;
        enunciado: string;
        temaId: number;
    }>;
    findAll(): Promise<{
        id: number;
        enunciado: string;
        temaId: number;
    }[]>;
    update(id: string, updatePerguntaDto: UpdatePerguntaDto): Promise<ConflictException | {
        id: number;
        enunciado: string;
        temaId: number;
    }>;
    remove(id: string): Promise<{
        id: number;
        enunciado: string;
        temaId: number;
    }>;
}
